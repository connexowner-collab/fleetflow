"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ShieldCheck, Mail, Building, Smartphone, Monitor, X, Check, Globe, LayoutDashboard, Pencil, Trash2, Power } from 'lucide-react';

type UserRow = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  telas_permitidas: string[];
  tenant_id: string;
  tenants: { nome: string } | null;
};

const perfilLabel: Record<string, string> = {
  motorista: 'Motorista',
  analista: 'Analista de Frota',
  gestor: 'Gestor',
  diretor: 'Diretor',
};

const TELAS = [
  { id: 'checklist', label: 'Checklist Diário', desc: 'Inspeção padrão de rotina', icon: '📋' },
  { id: 'troca', label: 'Troca de Veículo', desc: 'Devolução e retirada', icon: '🔄' },
  { id: 'ocorrencia', label: 'Reportar Ocorrência', desc: 'Manutenção ou avarias', icon: '⚠️' },
  { id: 'historico', label: 'Meu Histórico', desc: 'Consultar laudos passados', icon: '📜' },
];

const ACESSOS = [
  { value: 'app', icon: <Smartphone className="w-4 h-4 mr-2 text-brand-primary" />, label: 'App Mobile', desc: 'Checklists, KM e ocorrências.' },
  { value: 'web', icon: <Monitor className="w-4 h-4 mr-2 text-gray-400" />, label: 'Painel Web', desc: 'Dashboard, relatórios e gestão.' },
  { value: 'ambos', icon: <Globe className="w-4 h-4 mr-2 text-green-500" />, label: 'App + Painel Web', desc: 'Acesso completo.' },
];

export default function UsersManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<UserRow | null>(null);
  const [modalDeletar, setModalDeletar] = useState<UserRow | null>(null);

  // Form criar
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Motorista');
  const [newAcesso, setNewAcesso] = useState('app');
  const [newTelas, setNewTelas] = useState<string[]>(['checklist', 'troca', 'ocorrencia', 'historico']);

  // Form editar
  const [editNome, setEditNome] = useState('');
  const [editRole, setEditRole] = useState('Motorista');
  const [editTelas, setEditTelas] = useState<string[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  const loadUsers = useCallback(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => setUsers([]));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const toggleTela = (tela: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(tela) ? list.filter(t => t !== tela) : [...list, tela]);
  };

  // Criar
  const handleCriar = async () => {
    if (!newName.trim() || !newEmail.trim()) { showToast('⚠️ Preencha nome e e-mail.'); return; }
    setLoading(true); setModalCriar(false);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, nome: newName, cargo: newRole, acesso: newAcesso, telas: newTelas }),
    });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : `✅ Convite enviado para ${newEmail}`);
    if (!data.error) loadUsers();
    setNewName(''); setNewEmail(''); setNewRole('Motorista'); setNewAcesso('app'); setNewTelas(['checklist', 'troca', 'ocorrencia', 'historico']);
    setLoading(false);
  };

  // Editar
  const openEditar = (u: UserRow) => {
    setEditNome(u.nome); setEditRole(perfilLabel[u.perfil] ?? 'Motorista');
    setEditTelas(u.telas_permitidas ?? ['checklist', 'troca', 'ocorrencia', 'historico']);
    setModalEditar(u);
  };
  const handleEditar = async () => {
    if (!modalEditar) return;
    setLoading(true); setModalEditar(null);
    const res = await fetch(`/api/admin/users/${modalEditar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: editNome, cargo: editRole, telas_permitidas: editTelas }),
    });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : '✅ Usuário atualizado!');
    if (!data.error) loadUsers();
    setLoading(false);
  };

  // Toggle status
  const handleToggleStatus = async (u: UserRow) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : `${!u.ativo ? '✅ Usuário ativado' : '🔴 Usuário desativado'}`);
    if (!data.error) loadUsers();
  };

  // Deletar
  const handleDeletar = async () => {
    if (!modalDeletar) return;
    setLoading(true); setModalDeletar(null);
    const res = await fetch(`/api/admin/users/${modalDeletar.id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : '🗑️ Usuário excluído.');
    if (!data.error) loadUsers();
    setLoading(false);
  };

  const filtered = users.filter(u =>
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> {toast}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-brand-primary" /> Gestão de Acessos
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Controle quem acessa o dashboard e o aplicativo mobile.</p>
        </div>
        <button onClick={() => setModalCriar(true)} disabled={loading}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl flex items-center font-bold shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
          <Plus className="w-5 h-5 mr-2" /> Novo Acesso
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar nome ou e-mail..."
              className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-gray-400 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">Telas App</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum usuário encontrado</td></tr>
              )}
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome || u.email)}&background=0056B3&color=fff&bold=true`}
                        alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow" />
                      <div>
                        <p className="font-black text-gray-900">{u.nome || '-'}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg text-xs border border-gray-200">
                      <Building className="w-3 h-3 text-brand-primary/50" />{u.tenants?.nome ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 font-bold text-gray-800">
                      <ShieldCheck className="w-4 h-4 text-brand-primary" />{perfilLabel[u.perfil] ?? u.perfil}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(u.telas_permitidas ?? []).map(t => {
                        const tela = TELAS.find(x => x.id === t);
                        return tela ? (
                          <span key={t} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-bold">
                            {tela.icon} {tela.label.split(' ')[0]}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => handleToggleStatus(u)}
                      className={`flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 ${u.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                      <Power className="w-3 h-3" />{u.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditar(u)} title="Editar"
                        className="p-2 rounded-xl text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setModalDeletar(u)} title="Excluir"
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL CRIAR ── */}
      {modalCriar && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModalCriar(false)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-lg animate-in slide-in-from-right duration-300 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">
                <div className="bg-gray-50 px-8 py-8 border-b flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Novo Acesso</h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">O usuário receberá o convite por e-mail</p>
                  </div>
                  <button onClick={() => setModalCriar(false)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 px-8 py-6 space-y-5 overflow-y-auto">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                      placeholder="Nome do usuário..." />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">E-mail (Login)</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                      placeholder="email@empresa.com.br" />
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Mail className="w-3 h-3" />O link de acesso será enviado automaticamente.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Perfil</label>
                      <select value={newRole} onChange={e => setNewRole(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                        <option>Motorista</option><option>Analista de Frota</option><option>Gestor</option><option>Diretor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Plataforma</label>
                      <select value={newAcesso} onChange={e => setNewAcesso(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                        {ACESSOS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {(newAcesso === 'app' || newAcesso === 'ambos') && (
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Telas Visíveis no App</label>
                      <div className="space-y-2">
                        {TELAS.map(t => (
                          <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${newTelas.includes(t.id) ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={newTelas.includes(t.id)} onChange={() => toggleTela(t.id, newTelas, setNewTelas)} className="w-4 h-4 text-brand-primary rounded" />
                            <span className="text-lg">{t.icon}</span>
                            <div>
                              <span className="font-black text-gray-900 text-sm">{t.label}</span>
                              <span className="block text-xs text-gray-400">{t.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t px-8 py-5 flex gap-3 shrink-0">
                  <button onClick={() => setModalCriar(false)} className="flex-1 py-3 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleCriar} disabled={loading} className="flex-[2] py-3 text-xs font-black text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50">
                    <Check className="w-4 h-4" />Criar e Enviar Convite
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ── */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModalEditar(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-lg animate-in slide-in-from-right duration-300 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">
                <div className="bg-gray-50 px-8 py-8 border-b flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Editar Usuário</h2>
                    <p className="text-xs text-gray-400 mt-1">{modalEditar.email}</p>
                  </div>
                  <button onClick={() => setModalEditar(null)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 px-8 py-6 space-y-5 overflow-y-auto">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome</label>
                    <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Perfil</label>
                    <select value={editRole} onChange={e => setEditRole(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                      <option>Motorista</option><option>Analista de Frota</option><option>Gestor</option><option>Diretor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Telas Visíveis no App</label>
                    <div className="space-y-2">
                      {TELAS.map(t => (
                        <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${editTelas.includes(t.id) ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={editTelas.includes(t.id)} onChange={() => toggleTela(t.id, editTelas, setEditTelas)} className="w-4 h-4 text-brand-primary rounded" />
                          <span className="text-lg">{t.icon}</span>
                          <div>
                            <span className="font-black text-gray-900 text-sm">{t.label}</span>
                            <span className="block text-xs text-gray-400">{t.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t px-8 py-5 flex gap-3 shrink-0">
                  <button onClick={() => setModalEditar(null)} className="flex-1 py-3 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleEditar} disabled={loading} className="flex-[2] py-3 text-xs font-black text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50">
                    <Check className="w-4 h-4" />Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DELETAR ── */}
      {modalDeletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setModalDeletar(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Excluir Usuário</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir <strong>{modalDeletar.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalDeletar(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm rounded-xl transition-all">Cancelar</button>
                <button onClick={handleDeletar} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl transition-all">Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
