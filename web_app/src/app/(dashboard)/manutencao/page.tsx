"use client";

import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, X, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown, User, PlayCircle, Ban, Truck, Calendar, DollarSign } from 'lucide-react';

interface Manutencao {
  id: string; codigo: string | null; veiculo_placa: string; veiculo_modelo: string | null;
  motorista_nome: string | null; tipo: string; motivo: string | null; descricao: string;
  status: string; urgencia: string | null; data_agendada: string | null; data_realizada: string | null;
  km_agendamento: number | null; km_atual: number | null; km_realizado: number | null;
  custo: number | null; responsavel: string | null; observacoes: string | null; created_at: string;
}
interface Veiculo { id: string; placa: string; modelo: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string; icon: React.ElementType }> = {
  agendada:               { label: 'Agendada',               color: 'text-blue-600 bg-blue-50',     border: 'border-blue-100',   icon: Clock        },
  em_andamento:           { label: 'Em Andamento',           color: 'text-amber-600 bg-amber-50',   border: 'border-amber-100',  icon: AlertCircle  },
  aguardando_atendimento: { label: 'Aguardando',             color: 'text-orange-600 bg-orange-50', border: 'border-orange-100', icon: Clock        },
  aguardando_manutencao:  { label: 'Ag. Manutenção',        color: 'text-purple-600 bg-purple-50', border: 'border-purple-100', icon: Clock        },
  em_manutencao:          { label: 'Em Manutenção',         color: 'text-amber-700 bg-amber-100',  border: 'border-amber-200',  icon: Wrench       },
  concluida:              { label: 'Concluída',              color: 'text-emerald-600 bg-emerald-50',border: 'border-emerald-100',icon: CheckCircle  },
  cancelada:              { label: 'Cancelada',              color: 'text-gray-500 bg-gray-100',    border: 'border-gray-200',   icon: XCircle      },
  recusado:               { label: 'Recusado',               color: 'text-red-600 bg-red-50',       border: 'border-red-100',    icon: Ban          },
  manutencao_reprovada:   { label: 'Reprovada',              color: 'text-red-700 bg-red-100',      border: 'border-red-200',    icon: XCircle      },
};
function getStatusConfig(s: string) { return STATUS_CONFIG[s] ?? { label: s, color: 'text-gray-500 bg-gray-100', border: 'border-gray-100', icon: Clock }; }

const URGENCIA_COLOR: Record<string, string> = { muito_alta: 'bg-red-100 text-red-700', alta: 'bg-orange-100 text-orange-700', media: 'bg-amber-100 text-amber-700', baixa: 'bg-emerald-100 text-emerald-700' };
const URGENCIA_LABEL: Record<string, string> = { muito_alta: 'Muito Alta', alta: 'Alta', media: 'Média', baixa: 'Baixa' };
const TIPO_COLOR: Record<string, string> = { preventiva: 'bg-brand-secondary/10 text-brand-secondary', corretiva: 'bg-red-100 text-red-700', revisao: 'bg-purple-100 text-purple-700' };
const TIPO_LABEL: Record<string, string> = { preventiva: 'Preventiva', corretiva: 'Corretiva', revisao: 'Revisão' };

const FILTROS = [
  { value: 'all', label: 'Todos' },
  { value: 'aguardando_atendimento', label: 'Aguardando' },
  { value: 'em_manutencao', label: 'Em Oficina' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

export default function ManutencaoPage() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Manutencao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [form, setForm] = useState({
    veiculo_id: '', veiculo_placa: '', veiculo_modelo: '', tipo: 'preventiva',
    descricao: '', data_agendada: '', km_agendamento: '', responsavel: '',
    observacoes: '', status: 'agendada', data_realizada: '', km_realizado: '', custo: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = filtroStatus !== 'all' ? `?status=${filtroStatus}` : '';
    const res = await fetch(`/api/admin/manutencao${params}`);
    const json = await res.json();
    setManutencoes(json.manutencoes ?? []);
    setLoading(false);
  }, [filtroStatus]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch('/api/admin/veiculos').then(r => r.json()).then(j => setVeiculos(j.veiculos ?? [])); }, []);

  function abrirForm(m?: Manutencao) {
    if (m) {
      setEditando(m);
      setForm({ veiculo_id: '', veiculo_placa: m.veiculo_placa, veiculo_modelo: m.veiculo_modelo ?? '', tipo: m.tipo, descricao: m.descricao, data_agendada: m.data_agendada ?? '', km_agendamento: m.km_agendamento?.toString() ?? '', responsavel: m.responsavel ?? '', observacoes: m.observacoes ?? '', status: m.status, data_realizada: m.data_realizada ?? '', km_realizado: m.km_realizado?.toString() ?? '', custo: m.custo?.toString() ?? '' });
    } else {
      setEditando(null);
      setForm({ veiculo_id: '', veiculo_placa: '', veiculo_modelo: '', tipo: 'preventiva', descricao: '', data_agendada: '', km_agendamento: '', responsavel: '', observacoes: '', status: 'agendada', data_realizada: '', km_realizado: '', custo: '' });
    }
    setShowForm(true);
  }

  async function salvar() {
    setSalvando(true);
    if (editando) {
      await fetch('/api/admin/manutencao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editando.id, descricao: form.descricao, data_realizada: form.data_realizada || null, km_realizado: form.km_realizado ? parseInt(form.km_realizado) : null, custo: form.custo ? parseFloat(form.custo) : null, responsavel: form.responsavel || null, observacoes: form.observacoes || null }) });
    } else {
      const veiculo = veiculos.find(v => v.id === form.veiculo_id);
      await fetch('/api/admin/manutencao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, veiculo_placa: veiculo?.placa ?? form.veiculo_placa, veiculo_modelo: veiculo?.modelo ?? form.veiculo_modelo, km_agendamento: form.km_agendamento ? parseInt(form.km_agendamento) : null }) });
    }
    setSalvando(false); setShowForm(false); load();
  }

  async function acao(id: string, tipo: string, observacao?: string) {
    setActionLoading(id + tipo);
    await fetch('/api/admin/manutencao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, acao: tipo, observacao }) });
    setActionLoading(null); load();
  }

  async function handleIniciar(m: Manutencao) { await acao(m.id, 'iniciar'); }
  async function handleConfirmarEntrada(m: Manutencao) { await acao(m.id, 'confirmar_entrada'); }
  async function handleConcluir(m: Manutencao) { const obs = prompt('Observação (opcional):'); await acao(m.id, 'concluir', obs ?? undefined); }
  async function handleRecusar(m: Manutencao) { const obs = prompt('Motivo da recusa:'); if (!obs?.trim()) return; await acao(m.id, 'recusar', obs.trim()); }
  async function handleCancelar(m: Manutencao) { if (!confirm('Cancelar esta manutenção?')) return; await acao(m.id, 'cancelar'); }
  async function excluir(id: string) { if (!confirm('Excluir?')) return; await fetch(`/api/admin/manutencao?id=${id}`, { method: 'DELETE' }); load(); }

  const pendentes  = manutencoes.filter(m => m.status === 'aguardando_atendimento').length;
  const emCurso    = manutencoes.filter(m => ['aguardando_manutencao','em_manutencao','em_andamento'].includes(m.status)).length;
  const concluidas = manutencoes.filter(m => m.status === 'concluida').length;

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all";

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manutenção</h1>
          <p className="text-sm text-gray-400 mt-0.5">Solicitações e agendamentos</p>
        </div>
        <button onClick={() => abrirForm()}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nova</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-orange-600">{pendentes}</p>
          <p className="text-xs text-orange-500 font-semibold mt-0.5">Aguardando</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{emCurso}</p>
          <p className="text-xs text-amber-500 font-semibold mt-0.5">Em Andamento</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{concluidas}</p>
          <p className="text-xs text-emerald-500 font-semibold mt-0.5">Concluídas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTROS.map(f => (
          <button key={f.value} onClick={() => setFiltroStatus(f.value)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
              filtroStatus === f.value ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista de cards */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />)}
        </div>
      ) : manutencoes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Wrench className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Nenhuma manutenção encontrada</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {manutencoes.map(m => {
            const sc = getStatusConfig(m.status);
            const StatusIcon = sc.icon;
            const isLoading = actionLoading?.startsWith(m.id);
            return (
              <div key={m.id} className={`bg-white rounded-2xl border ${sc.border} shadow-sm overflow-hidden`}>
                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${sc.color}`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{m.veiculo_placa}</span>
                          {m.urgencia && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${URGENCIA_COLOR[m.urgencia] ?? 'bg-gray-100 text-gray-600'}`}>
                              {URGENCIA_LABEL[m.urgencia]}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR[m.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                            {TIPO_LABEL[m.tipo] ?? m.tipo}
                          </span>
                        </div>
                        {m.veiculo_modelo && <p className="text-xs text-gray-400 mt-0.5">{m.veiculo_modelo}</p>}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" /> {sc.label}
                    </span>
                  </div>

                  {/* Descrição */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{m.motivo || m.descricao}</p>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                    {m.motorista_nome && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{m.motorista_nome}</span>
                    )}
                    {(m.km_atual ?? m.km_agendamento) && (
                      <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{(m.km_atual ?? m.km_agendamento)!.toLocaleString('pt-BR')} km</span>
                    )}
                    {m.data_agendada && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.data_agendada).toLocaleDateString('pt-BR')}</span>
                    )}
                    {m.custo && (
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {m.custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    )}
                    {m.responsavel && (
                      <span className="flex items-center gap-1">🔧 {m.responsavel}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {m.status === 'aguardando_atendimento' && (
                      <>
                        <button disabled={isLoading} onClick={() => handleIniciar(m)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 transition-colors disabled:opacity-50">
                          <PlayCircle className="w-3.5 h-3.5" /> Iniciar
                        </button>
                        <button disabled={isLoading} onClick={() => handleRecusar(m)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold transition-colors">
                          Recusar
                        </button>
                      </>
                    )}
                    {m.status === 'aguardando_manutencao' && (
                      <>
                        <button disabled={isLoading} onClick={() => handleConfirmarEntrada(m)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold transition-colors">
                          Confirmar Entrada
                        </button>
                        <button disabled={isLoading} onClick={() => handleCancelar(m)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">
                          Cancelar
                        </button>
                      </>
                    )}
                    {m.status === 'em_manutencao' && (
                      <button disabled={isLoading} onClick={() => handleConcluir(m)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 transition-colors disabled:opacity-50">
                        <CheckCircle className="w-3.5 h-3.5" /> Concluir
                      </button>
                    )}
                    {['agendada', 'em_andamento'].includes(m.status) && (
                      <button onClick={() => abrirForm(m)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors">
                        Editar
                      </button>
                    )}
                    {!['concluida','cancelada','recusado','manutencao_reprovada'].includes(m.status) && (
                      <button onClick={() => excluir(m.id)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-red-50 hover:bg-red-100 text-red-500 font-bold transition-colors">
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-brand-primary" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">{editando ? 'Editar Manutenção' : 'Nova Manutenção'}</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {!editando && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Veículo</label>
                    <div className="relative">
                      <select className={inputCls + " appearance-none pr-8"} value={form.veiculo_id}
                        onChange={e => { const v = veiculos.find(x => x.id === e.target.value); setForm(f => ({ ...f, veiculo_id: e.target.value, veiculo_placa: v?.placa ?? '', veiculo_modelo: v?.modelo ?? '' })); }}>
                        <option value="">Selecionar veículo...</option>
                        {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                      <div className="relative">
                        <select className={inputCls + " appearance-none pr-8"} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                          <option value="preventiva">Preventiva</option>
                          <option value="corretiva">Corretiva</option>
                          <option value="revisao">Revisão</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data Agendada</label>
                      <input type="date" className={inputCls} value={form.data_agendada} onChange={e => setForm(f => ({ ...f, data_agendada: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">KM para Revisão</label>
                    <input type="number" placeholder="Ex: 50000" className={inputCls} value={form.km_agendamento} onChange={e => setForm(f => ({ ...f, km_agendamento: e.target.value }))} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descrição *</label>
                <input type="text" placeholder="Descreva o serviço..." className={inputCls} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Responsável / Oficina</label>
                <input type="text" placeholder="Nome da oficina ou mecânico" className={inputCls} value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
              </div>
              {editando && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data Realizada</label>
                    <input type="date" className={inputCls} value={form.data_realizada} onChange={e => setForm(f => ({ ...f, data_realizada: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">KM Realizado</label>
                    <input type="number" className={inputCls} value={form.km_realizado} onChange={e => setForm(f => ({ ...f, km_realizado: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Custo (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" className={inputCls} value={form.custo} onChange={e => setForm(f => ({ ...f, custo: e.target.value }))} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Observações</label>
                <textarea rows={2} className={inputCls + " resize-none"} value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.descricao}
                className="flex-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
