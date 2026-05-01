"use client";

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, Plus, X, ChevronDown, AlertCircle, Wrench, FileText, ClipboardCheck, Info } from 'lucide-react';

interface Notificacao {
  id: string; tipo: string; prioridade: 'alta' | 'media' | 'baixa';
  titulo: string; mensagem: string; lida: boolean; created_at: string; destinatario: string;
}

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  documento_vencimento: { label: 'Documento',  icon: FileText,       color: 'text-red-600',    bg: 'bg-red-50 border-red-100'    },
  manutencao_agendada:  { label: 'Manutenção', icon: Wrench,         color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
  ocorrencia_grave:     { label: 'Ocorrência', icon: AlertCircle,    color: 'text-red-600',    bg: 'bg-red-50 border-red-100'    },
  checklist_pendente:   { label: 'Checklist',  icon: ClipboardCheck, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-100'  },
  sistema:              { label: 'Sistema',    icon: Info,           color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200'  },
};

const PRIO: Record<string, { label: string; dot: string }> = {
  alta:  { label: 'Alta',  dot: 'bg-red-500'    },
  media: { label: 'Média', dot: 'bg-amber-400'  },
  baixa: { label: 'Baixa', dot: 'bg-gray-300'   },
};

function formatarTempo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const FILTROS = [
  { value: 'all',                  label: 'Todas'      },
  { value: 'nao_lidas',            label: 'Não lidas'  },
  { value: 'ocorrencia_grave',     label: 'Ocorrências'},
  { value: 'manutencao_agendada',  label: 'Manutenção' },
  { value: 'documento_vencimento', label: 'Documentos' },
  { value: 'sistema',              label: 'Sistema'    },
];

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ tipo: 'sistema', prioridade: 'media', titulo: '', mensagem: '', destinatario: 'all' });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/notificacoes');
    const json = await res.json();
    setNotificacoes(json.notificacoes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtradas = filtro === 'all' ? notificacoes
    : filtro === 'nao_lidas' ? notificacoes.filter(n => !n.lida)
    : notificacoes.filter(n => n.tipo === filtro);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  async function marcarLida(id: string) {
    await fetch('/api/notificacoes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, lida: true }) });
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }

  async function marcarTodas() {
    await fetch('/api/notificacoes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marcar_todas: true }) });
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }

  async function excluir(id: string) {
    await fetch(`/api/notificacoes?id=${id}`, { method: 'DELETE' });
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  }

  async function salvar() {
    setSalvando(true);
    await fetch('/api/notificacoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSalvando(false); setShowForm(false);
    setForm({ tipo: 'sistema', prioridade: 'media', titulo: '', mensagem: '', destinatario: 'all' });
    load();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Notificações
              {naoLidas > 0 && (
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{naoLidas}</span>
              )}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Central de alertas do sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {naoLidas > 0 && (
            <button onClick={marcarTodas}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 border border-gray-200 bg-white px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
            </button>
          )}
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      {/* Filtros — scroll horizontal mobile */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTROS.map(f => {
          const count = f.value === 'nao_lidas' ? naoLidas : undefined;
          return (
            <button key={f.value} onClick={() => setFiltro(f.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                filtro === f.value ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}>
              {f.label}
              {count !== undefined && count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${filtro === f.value ? 'bg-white/30 text-white' : 'bg-red-500 text-white'}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BellOff className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">
            {filtro === 'nao_lidas' ? 'Todas as notificações foram lidas.' : 'Nenhuma notificação aqui.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtradas.map(n => {
            const tc = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.sistema;
            const pc = PRIO[n.prioridade] ?? PRIO.media;
            const Icon = tc.icon;
            return (
              <div key={n.id} className={`bg-white rounded-2xl border transition-all ${!n.lida ? 'border-brand-primary/20 shadow-sm' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3 p-4">
                  {/* Ícone tipo */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tc.bg}`}>
                    <Icon className={`w-5 h-5 ${tc.color}`} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!n.lida && <span className={`w-1.5 h-1.5 rounded-full ${pc.dot} shrink-0`} />}
                          <p className={`text-sm font-bold truncate ${!n.lida ? 'text-gray-900' : 'text-gray-600'}`}>{n.titulo}</p>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2">{n.mensagem}</p>
                      </div>
                      <span className="text-[10px] text-gray-300 shrink-0 mt-0.5">{formatarTempo(n.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tc.bg} ${tc.color}`}>{tc.label}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{pc.label} prioridade</span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.lida && (
                      <button onClick={() => marcarLida(n.id)} title="Marcar como lida"
                        className="p-1.5 rounded-xl hover:bg-emerald-50 text-gray-300 hover:text-emerald-500 transition-colors">
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => excluir(n.id)} title="Excluir"
                      className="p-1.5 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nova notificação */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 text-brand-primary" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Nova Notificação</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <div className="relative">
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                      <option value="sistema">Sistema</option>
                      <option value="documento_vencimento">Documento</option>
                      <option value="manutencao_agendada">Manutenção</option>
                      <option value="ocorrencia_grave">Ocorrência</option>
                      <option value="checklist_pendente">Checklist</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Prioridade</label>
                  <div className="relative">
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                      value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título *</label>
                <input type="text" placeholder="Título da notificação"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Mensagem *</label>
                <textarea rows={3} placeholder="Detalhes da notificação..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none transition-all"
                  value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.titulo || !form.mensagem}
                className="flex-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                {salvando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
