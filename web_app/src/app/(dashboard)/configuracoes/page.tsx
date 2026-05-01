"use client";

import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Settings, Building, Bell, Shield, Save, CheckCircle, ClipboardList, Plus, Trash2, MapPin, Briefcase, Grid3X3, Wrench } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { applyBrandColor } from '@/utils/brand';

type Opcao = { id: string; valor: string; ativo: boolean };
type Categoria = 'unidade' | 'setor' | 'area' | 'item_inspecao' | 'menu';

/* ── API helpers ─────────────────────────────────────────────────────────── */
async function fetchOpcoes(all = false) {
  const res = await fetch(`/api/admin/config${all ? '?all=true' : ''}`);
  const json = await res.json();
  return (json.opcoes ?? []) as { id: string; categoria: string; valor: string; ativo: boolean }[];
}

async function toggleOpcaoAPI(id: string, ativo: boolean) {
  const res = await fetch('/api/admin/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ativo }),
  });
  return res.json();
}

async function adicionarOpcaoAPI(categoria: string, valor: string) {
  const res = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoria, valor }),
  });
  return res.json();
}

async function removerOpcaoAPI(id: string) {
  const res = await fetch('/api/admin/config', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  return res.json();
}

/* ── OpcaoManager — definido FORA do componente pai para não perder foco ── */
interface OpcaoManagerProps {
  cat: Categoria;
  lista: Opcao[];
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  inputValue: string;
  onInputChange: (cat: Categoria, val: string) => void;
  onAdicionar: (cat: Categoria) => void;
  onRemover: (cat: Categoria, id: string, valor: string) => void;
}

function OpcaoManager({ cat, lista, icon, label, loading, inputValue, onInputChange, onAdicionar, onRemover }: OpcaoManagerProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary flex-shrink-0">{icon}</div>
        <h3 className="text-base font-bold text-gray-900 flex-1">{label}</h3>
        <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
          {lista.length} {lista.length === 1 ? 'opção' : 'opções'}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(cat, e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdicionar(cat)}
          placeholder={`Nova opção...`}
          className="flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
        />
        <button
          onClick={() => onAdicionar(cat)}
          disabled={!inputValue.trim()}
          className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-40 transition-all flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-6 text-gray-400 text-sm">Carregando...</div>
      ) : lista.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          Nenhuma opção cadastrada
        </div>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {lista.map(op => (
            <div key={op.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100 group">
              <span className="text-sm text-gray-800 font-medium truncate flex-1">{op.valor}</span>
              <button
                onClick={() => onRemover(cat, op.id, op.valor)}
                className="ml-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function ConfiguracoesPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [corPrimaria, setCorPrimaria] = useState('#0056B3');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifGrave, setNotifGrave] = useState(true);
  const [notifChecklist, setNotifChecklist] = useState(false);
  const [sessaoTimeout, setSessaoTimeout] = useState('60');
  const [abaAtiva, setAbaAtiva] = useState<'empresa' | 'checklist'>('empresa');

  const [unidades, setUnidades] = useState<Opcao[]>([]);
  const [setores, setSetores] = useState<Opcao[]>([]);
  const [areas, setAreas] = useState<Opcao[]>([]);
  const [menus, setMenus] = useState<Opcao[]>([]);
  const [itensInspecao, setItensInspecao] = useState<Opcao[]>([]);
  const [novaOpcao, setNovaOpcao] = useState<Record<Categoria, string>>({
    unidade: '', setor: '', area: '', item_inspecao: '', menu: '',
  });
  const [loadingOpcoes, setLoadingOpcoes] = useState(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: tenant } = await supabase.from('tenants').select('*').single();
      if (tenant) {
        setEmpresa(tenant.nome ?? '');
        setCnpj(tenant.cnpj ?? '');
        setEmailContato(tenant.email ?? '');
        setCorPrimaria(tenant.cor_primaria ?? '#0056B3');
      }
      const opcoes = await fetchOpcoes(true);
      setUnidades(opcoes.filter(o => o.categoria === 'unidade').map(o => ({ id: o.id, valor: o.valor, ativo: o.ativo })));
      setSetores(opcoes.filter(o => o.categoria === 'setor').map(o => ({ id: o.id, valor: o.valor, ativo: o.ativo })));
      setAreas(opcoes.filter(o => o.categoria === 'area').map(o => ({ id: o.id, valor: o.valor, ativo: o.ativo })));
      setMenus(opcoes.filter(o => o.categoria === 'menu').map(o => ({ id: o.id, valor: o.valor, ativo: o.ativo })));
      setItensInspecao(opcoes.filter(o => o.categoria === 'item_inspecao').map(o => ({ id: o.id, valor: o.valor, ativo: o.ativo })));
      setLoadingOpcoes(false);
    }
    load();
  }, []);

  const DEFAULT_MENUS = [
    'Dashboard', 'Gestão da Frota', 'Checklists', 'Ocorrências', 'Manutenção',
    'Combustível', 'Documentos', 'Rastreamento', 'Relatórios & BI', 'Notificações',
    'Gestão de Acessos', 'Aprovações de Troca', 'Configurações'
  ];

  const handleToggleAtivo = async (id: string | null, cat: string, atual: boolean, valor?: string) => {
    let targetId = id;

    // Se não tem ID, significa que ainda não existe no banco (é um menu padrão novo)
    if (!targetId && valor) {
      const json = await adicionarOpcaoAPI('menu', valor);
      if (json.error) { showToast(`⚠️ ${json.error}`); return; }
      targetId = json.opcao.id;
      // Por padrão ao criar via POST ele vem como ativo:true, então se o usuário
      // clicou pra desativar algo que era "virtualmente" ativo, precisamos do PATCH
      await toggleOpcaoAPI(targetId!, false);
    } else if (targetId) {
      const json = await toggleOpcaoAPI(targetId, !atual);
      if (json.error) { showToast(`⚠️ ${json.error}`); return; }
    }

    // Refresh da lista de menus para refletir o ID e status real
    const opcoes = await fetchOpcoes(true);
    setMenus(opcoes.filter(o => o.categoria === 'menu').map(o => ({ id: o.id, valor: o.valor, ativo: o.ativo })));
    
    // Atualiza outras categorias se necessário
    const update = (prev: Opcao[]) => prev.map(o => o.id === targetId ? { ...o, ativo: !atual } : o);
    if (cat === 'unidade') setUnidades(update);
    if (cat === 'setor') setSetores(update);
    if (cat === 'area') setAreas(update);
    if (cat === 'item_inspecao') setItensInspecao(update);

    // Dispara evento para o Sidebar se atualizar
    window.dispatchEvent(new CustomEvent('fleetflow:menu-updated'));

    showToast(`✅ Status atualizado!`);
  };

  const handleSalvarEmpresa = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from('tenants')
      .update({ nome: empresa, cnpj, email: emailContato, cor_primaria: corPrimaria })
      .eq('id', (await supabase.from('tenants').select('id').single()).data?.id);
    if (!error) applyBrandColor(corPrimaria);
    showToast(error ? `⚠️ Erro: ${error.message}` : '✅ Dados da empresa salvos!');
  };

  const handleInputChange = useCallback((cat: Categoria, val: string) => {
    setNovaOpcao(prev => ({ ...prev, [cat]: val }));
  }, []);

  const handleAdicionar = useCallback(async (cat: Categoria) => {
    const valor = novaOpcao[cat].trim();
    if (!valor) return;

    const json = await adicionarOpcaoAPI(cat, valor);
    if (json.error) { showToast(`⚠️ ${json.error}`); return; }

    const nova: Opcao = { id: json.opcao.id, valor: json.opcao.valor, ativo: json.opcao.ativo };
    const sort = (a: Opcao, b: Opcao) => a.valor.localeCompare(b.valor);
    if (cat === 'unidade') setUnidades(prev => [...prev, nova].sort(sort));
    if (cat === 'setor') setSetores(prev => [...prev, nova].sort(sort));
    if (cat === 'area') setAreas(prev => [...prev, nova].sort(sort));
    if (cat === 'menu') setMenus(prev => [...prev, nova].sort(sort));
    if (cat === 'item_inspecao') setItensInspecao(prev => [...prev, nova]);

    setNovaOpcao(prev => ({ ...prev, [cat]: '' }));
    showToast(`✅ "${valor}" adicionado!`);
  }, [novaOpcao]);

  const handleRemover = useCallback(async (cat: Categoria, id: string, valor: string) => {
    const json = await removerOpcaoAPI(id);
    if (json.error) { showToast(`⚠️ ${json.error}`); return; }

    if (cat === 'unidade')      setUnidades(prev => prev.filter(o => o.id !== id));
    if (cat === 'setor')        setSetores(prev => prev.filter(o => o.id !== id));
    if (cat === 'area')         setAreas(prev => prev.filter(o => o.id !== id));
    if (cat === 'item_inspecao') setItensInspecao(prev => prev.filter(o => o.id !== id));

    showToast(`🗑️ "${valor}" removido.`);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-primary" />
          Configurações
        </h1>
        <p className="text-gray-500 mt-1">Gerencie empresa, dropdowns do checklist e preferências da plataforma.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setAbaAtiva('empresa')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${abaAtiva === 'empresa' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Building className="w-4 h-4" /> Empresa & Sistema
        </button>
        <button
          onClick={() => setAbaAtiva('checklist')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${abaAtiva === 'checklist' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ClipboardList className="w-4 h-4" /> Checklist Diário
        </button>
      </div>

      {/* Aba Empresa */}
      {abaAtiva === 'empresa' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary mr-3"><Building className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-gray-900">Dados da Empresa (Tenant)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Empresa</label>
                <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">CNPJ</label>
                <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail de Contato</label>
                <input type="email" value={emailContato} onChange={e => setEmailContato(e.target.value)} placeholder="contato@empresa.com.br"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cor Primária da Marca</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={corPrimaria}
                    onChange={e => { setCorPrimaria(e.target.value); applyBrandColor(e.target.value); }}
                    className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer p-1" />
                  <input type="text" value={corPrimaria}
                    onChange={e => { setCorPrimaria(e.target.value); if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyBrandColor(e.target.value); }}
                    placeholder="#0056B3"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm font-mono" />
                  <div className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0 shadow-inner" style={{ backgroundColor: corPrimaria }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">A cor é aplicada em tempo real na interface.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={handleSalvarEmpresa}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Empresa
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="p-2.5 bg-yellow-100 rounded-xl text-yellow-600 mr-3"><Bell className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-gray-900">Notificações</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Alertas por e-mail', desc: 'Receba resumos diários da operação.', state: notifEmail, set: setNotifEmail },
                { label: 'Alertas de ocorrência grave', desc: 'Notificação imediata quando ocorrência grave for registrada.', state: notifGrave, set: setNotifGrave },
                { label: 'Checklists pendentes de revisão', desc: 'Lembrete automático de checklists aguardando aprovação.', state: notifChecklist, set: setNotifChecklist },
              ].map(item => (
                <label key={item.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                  <div>
                    <span className="block text-sm font-semibold text-gray-900">{item.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{item.desc}</span>
                  </div>
                  <button type="button" onClick={() => item.set(!item.state)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.state ? 'bg-brand-primary' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.state ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => showToast('✅ Preferências de notificação salvas!')}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Notificações
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center mb-6">
              <div className="p-2.5 bg-green-100 rounded-xl text-green-600 mr-3"><Shield className="w-5 h-5" /></div>
              <h2 className="text-lg font-bold text-gray-900">Segurança</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Timeout de Sessão (minutos)</label>
                <select value={sessaoTimeout} onChange={e => setSessaoTimeout(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-sm bg-white">
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="120">2 horas</option>
                  <option value="0">Nunca expirar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Autenticação de Dois Fatores</label>
                <button onClick={() => showToast('🔐 2FA disponível na próxima versão.')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left flex items-center justify-between">
                  <span>Configurar 2FA</span>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">Em breve</span>
                </button>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => showToast('✅ Configurações de segurança atualizadas!')}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Segurança
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 mr-3"><Briefcase className="w-5 h-5" /></div>
                <h2 className="text-lg font-bold text-gray-900">Gerenciamento do Menu Lateral</h2>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Ative ou desative os itens que aparecem no menu principal do sistema.
              Novos itens podem ser adicionados, mas requerem implementação no código para funcionar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEFAULT_MENUS.map(label => {
                const dbMenu = menus.find(m => m.valor === label);
                const isAtivo = dbMenu ? dbMenu.ativo : true; // Ativo por padrão se não estiver no banco
                
                return (
                  <div key={label} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                    <span className={`text-sm font-medium ${isAtivo ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>
                    {label !== 'Configurações' ? (
                      <button
                        onClick={() => handleToggleAtivo(dbMenu?.id || null, 'menu', isAtivo, label)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isAtivo ? 'bg-brand-primary' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAtivo ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">
                        Obrigatório
                      </span>
                    )}
                  </div>
                );
              })}
              
              {/* Menus extras (cadastrados manualmente) */}
              {menus.filter(m => !DEFAULT_MENUS.includes(m.valor)).map(menu => (
                <div key={menu.id} className="flex items-center justify-between p-3 border border-indigo-50 rounded-xl bg-indigo-50/30">
                  <span className={`text-sm font-medium ${menu.ativo ? 'text-indigo-900' : 'text-gray-400'}`}>
                    {menu.valor}
                  </span>
                  <button
                    onClick={() => handleToggleAtivo(menu.id, 'menu', menu.ativo, menu.valor)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${menu.ativo ? 'bg-indigo-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${menu.ativo ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <input
                type="text"
                value={novaOpcao.menu}
                onChange={e => handleInputChange('menu', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdicionar('menu')}
                placeholder="Adicionar novo item de menu personalizado..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
              <button
                onClick={() => handleAdicionar('menu')}
                disabled={!novaOpcao.menu.trim()}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-6 flex justify-end border-t border-gray-50 pt-6">
              <button onClick={() => showToast('✅ Configurações do menu salvas!')}
                className="bg-brand-primary hover:bg-brand-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Menu
              </button>
            </div>
          </div>
        </>
      )}

      {/* Aba Checklist */}
      {abaAtiva === 'checklist' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-brand-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-brand-primary">Campos configuráveis do Checklist Diário</p>
              <p className="text-xs text-blue-700 mt-1">
                Todas as opções abaixo aparecem no aplicativo mobile. Alterações refletem imediatamente para todos os motoristas.
                O campo <strong>Veículo</strong> é gerenciado na tela de Frota.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <OpcaoManager cat="unidade" lista={unidades} label="Unidades"
              icon={<MapPin className="w-4 h-4" />} loading={loadingOpcoes}
              inputValue={novaOpcao.unidade} onInputChange={handleInputChange}
              onAdicionar={handleAdicionar} onRemover={handleRemover} />
            <OpcaoManager cat="setor" lista={setores} label="Setores"
              icon={<Briefcase className="w-4 h-4" />} loading={loadingOpcoes}
              inputValue={novaOpcao.setor} onInputChange={handleInputChange}
              onAdicionar={handleAdicionar} onRemover={handleRemover} />
            <OpcaoManager cat="area" lista={areas} label="Áreas"
              icon={<Grid3X3 className="w-4 h-4" />} loading={loadingOpcoes}
              inputValue={novaOpcao.area} onInputChange={handleInputChange}
              onAdicionar={handleAdicionar} onRemover={handleRemover} />
          </div>

          <OpcaoManager cat="item_inspecao" lista={itensInspecao} label="Itens de Inspeção Técnica"
            icon={<Wrench className="w-4 h-4" />} loading={loadingOpcoes}
            inputValue={novaOpcao.item_inspecao} onInputChange={handleInputChange}
            onAdicionar={handleAdicionar} onRemover={handleRemover} />
        </>
      )}


      <div className="pb-8" />
    </div>
  );
}
