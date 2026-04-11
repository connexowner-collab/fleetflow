"use client";

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, CheckCheck, Trash2, Plus, X, ChevronDown, AlertCircle, Wrench, FileText, ClipboardCheck, Info } from 'lucide-react';

interface Notificacao {
  id: string;
  tipo: string;
  prioridade: 'alta' | 'media' | 'baixa';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  destinatario: string;
}

const TIPO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  documento_vencimento: { label: 'Documento',      icon: FileText,       color: 'text-red-600 bg-red-50' },
  manutencao_agendada:  { label: 'Manutenção',     icon: Wrench,         color: 'text-yellow-600 bg-yellow-50' },
  ocorrencia_grave:     { label: 'Ocorrência',     icon: AlertCircle,    color: 'text-red-600 bg-red-50' },
  checklist_pendente:   { label: 'Checklist',      icon: ClipboardCheck, color: 'text-blue-600 bg-blue-50' },
  sistema:              { label: 'Sistema',        icon: Info,           color: 'text-gray-600 bg-gray-100' },
};

const PRIORIDADE_CONFIG = {
  alta:  { label: 'Alta',  color: 'text-red-600 bg-red-50 border-red-200' },
  media: { label: 'Média', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  baixa: { label: 'Baixa', color: 'text-gray-500 bg-gray-50 border-gray-200' },
};

function formatarTempo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} dias atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

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
    await fetch('/api/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, lida: true }),
    });
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }

  async function marcarTodas() {
    await fetch('/api/notificacoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marcar_todas: true }),
    });
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }

  async function excluir(id: string) {
    await fetch(`/api/notificacoes?id=${id}`, { method: 'DELETE' });
    setNotificacoes(prev => prev.filter(n => n.id !== id));
  }

  async function salvar() {
    setSalvando(true);
    await fetch('/api/notificacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSalvando(false);
    setShowForm(false);
    setForm({ tipo: 'sistema', prioridade: 'media', titulo: '', mensagem: '', destinatario: 'all' });
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-brand-primary" />
            Notificações
            {naoLidas > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{naoLidas}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Central de alertas e notificações do sistema</p>
        </div>
        <div className="flex gap-2">
          {naoLidas > 0 && (
            <button onClick={marcarTodas}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm">
              <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
            </button>
          )}
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium">
            <Plus className="w-4 h-4" /> Nova Notificação
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Todas' },
          { value: 'nao_lidas', label: `Não lidas${naoLidas > 0 ? ` (${naoLidas})` : ''}` },
          { value: 'documento_vencimento', label: 'Documentos' },
          { value: 'manutencao_agendada', label: 'Manutenção' },
          { value: 'ocorrencia_grave', label: 'Ocorrências' },
          { value: 'sistema', label: 'Sistema' },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.value ? 'bg-brand-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma notificação</p>
          <p className="text-gray-400 text-sm mt-1">
            {filtro === 'nao_lidas' ? 'Todas as notificações foram lidas.' : 'Nenhuma notificação encontrada para este filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(n => {
            const tc = TIPO_CONFIG[n.tipo] ?? TIPO_CONFIG.sistema;
            const pc = PRIORIDADE_CONFIG[n.prioridade] ?? PRIORIDADE_CONFIG.media;
            const Icon = tc.icon;
            return (
              <div key={n.id}
                className={`bg-white rounded-xl border transition-all ${
                  !n.lida ? 'border-brand-primary/30 shadow-sm' : 'border-gray-200'
                }`}>
                <div className="flex items-start gap-4 p-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold text-gray-900 ${!n.lida ? 'text-brand-primary' : ''}`}>{n.titulo}</p>
                        {!n.lida && <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${pc.color}`}>{pc.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.color}`}>{tc.label}</span>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatarTempo(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.mensagem}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!n.lida && (
                      <button onClick={() => marcarLida(n.id)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                        title="Marcar como lida">
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => excluir(n.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Nova Notificação</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridade</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
                <input type="text" placeholder="Título da notificação" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem *</label>
                <textarea rows={3} placeholder="Detalhes da notificação..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                  value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.titulo || !form.mensagem}
                className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
                {salvando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
