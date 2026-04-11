"use client";

import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, X, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown } from 'lucide-react';

type StatusType = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
type TipoType = 'preventiva' | 'corretiva' | 'revisao';

interface Manutencao {
  id: string;
  veiculo_placa: string;
  veiculo_modelo: string | null;
  tipo: TipoType;
  descricao: string;
  status: StatusType;
  data_agendada: string | null;
  data_realizada: string | null;
  km_agendamento: number | null;
  km_realizado: number | null;
  custo: number | null;
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
}

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; icon: React.ElementType }> = {
  agendada:     { label: 'Agendada',     color: 'text-blue-600 bg-blue-50',   icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle },
  concluida:    { label: 'Concluída',    color: 'text-green-600 bg-green-50',  icon: CheckCircle },
  cancelada:    { label: 'Cancelada',    color: 'text-gray-500 bg-gray-100',   icon: XCircle },
};

const TIPO_LABEL: Record<TipoType, string> = {
  preventiva: 'Preventiva',
  corretiva:  'Corretiva',
  revisao:    'Revisão',
};

const TIPO_COLOR: Record<TipoType, string> = {
  preventiva: 'bg-brand-secondary/10 text-brand-secondary',
  corretiva:  'bg-red-100 text-red-700',
  revisao:    'bg-purple-100 text-purple-700',
};

export default function ManutencaoPage() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Manutencao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    veiculo_id: '', veiculo_placa: '', veiculo_modelo: '',
    tipo: 'preventiva', descricao: '', data_agendada: '',
    km_agendamento: '', responsavel: '', observacoes: '',
    status: 'agendada', data_realizada: '', km_realizado: '', custo: '',
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

  useEffect(() => {
    fetch('/api/admin/veiculos').then(r => r.json()).then(j => setVeiculos(j.veiculos ?? []));
  }, []);

  function abrirForm(m?: Manutencao) {
    if (m) {
      setEditando(m);
      setForm({
        veiculo_id: '', veiculo_placa: m.veiculo_placa,
        veiculo_modelo: m.veiculo_modelo ?? '',
        tipo: m.tipo, descricao: m.descricao,
        data_agendada: m.data_agendada ?? '',
        km_agendamento: m.km_agendamento?.toString() ?? '',
        responsavel: m.responsavel ?? '',
        observacoes: m.observacoes ?? '',
        status: m.status,
        data_realizada: m.data_realizada ?? '',
        km_realizado: m.km_realizado?.toString() ?? '',
        custo: m.custo?.toString() ?? '',
      });
    } else {
      setEditando(null);
      setForm({ veiculo_id: '', veiculo_placa: '', veiculo_modelo: '', tipo: 'preventiva', descricao: '', data_agendada: '', km_agendamento: '', responsavel: '', observacoes: '', status: 'agendada', data_realizada: '', km_realizado: '', custo: '' });
    }
    setShowForm(true);
  }

  async function salvar() {
    setSalvando(true);
    if (editando) {
      await fetch('/api/admin/manutencao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editando.id,
          status: form.status,
          data_realizada: form.data_realizada || null,
          km_realizado: form.km_realizado ? parseInt(form.km_realizado) : null,
          custo: form.custo ? parseFloat(form.custo) : null,
          responsavel: form.responsavel || null,
          observacoes: form.observacoes || null,
          descricao: form.descricao,
        }),
      });
    } else {
      const veiculo = veiculos.find(v => v.id === form.veiculo_id);
      await fetch('/api/admin/manutencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          veiculo_placa: veiculo?.placa ?? form.veiculo_placa,
          veiculo_modelo: veiculo?.modelo ?? form.veiculo_modelo,
          km_agendamento: form.km_agendamento ? parseInt(form.km_agendamento) : null,
        }),
      });
    }
    setSalvando(false);
    setShowForm(false);
    load();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta manutenção?')) return;
    await fetch(`/api/admin/manutencao?id=${id}`, { method: 'DELETE' });
    load();
  }

  const agendadas   = manutencoes.filter(m => m.status === 'agendada').length;
  const emAndamento = manutencoes.filter(m => m.status === 'em_andamento').length;
  const concluidas  = manutencoes.filter(m => m.status === 'concluida').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-brand-primary" /> Manutenção
          </h1>
          <p className="text-gray-500 text-sm mt-1">Agendamento e histórico de revisões por veículo</p>
        </div>
        <button
          onClick={() => abrirForm()}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Nova Manutenção
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Agendadas',    value: agendadas,   color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Em Andamento', value: emAndamento, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Concluídas',   value: concluidas,  color: 'text-green-600',  bg: 'bg-green-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'agendada', 'em_andamento', 'concluida', 'cancelada'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === s
                ? 'bg-brand-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'Todos' : STATUS_CONFIG[s as StatusType]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : manutencoes.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma manutenção encontrada</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Nova Manutenção" para agendar</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Veículo', 'Tipo', 'Descrição', 'Data', 'KM', 'Responsável', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manutencoes.map(m => {
                const sc = STATUS_CONFIG[m.status];
                const Icon = sc.icon;
                return (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {m.veiculo_placa}
                      {m.veiculo_modelo && <span className="block text-xs text-gray-400 font-normal">{m.veiculo_modelo}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TIPO_COLOR[m.tipo]}`}>{TIPO_LABEL[m.tipo]}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{m.descricao}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.data_agendada ? new Date(m.data_agendada + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      {m.data_realizada && <span className="block text-xs text-green-600">{new Date(m.data_realizada + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {m.km_agendamento ? `${m.km_agendamento.toLocaleString('pt-BR')} km` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.responsavel || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                        <Icon className="w-3 h-3" /> {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => abrirForm(m)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">Editar</button>
                        <button onClick={() => excluir(m.id)} className="px-3 py-1.5 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium">Excluir</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editando ? 'Editar Manutenção' : 'Nova Manutenção'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {!editando && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Veículo</label>
                    <div className="relative">
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={form.veiculo_id}
                        onChange={e => {
                          const v = veiculos.find(x => x.id === e.target.value);
                          setForm(f => ({ ...f, veiculo_id: e.target.value, veiculo_placa: v?.placa ?? '', veiculo_modelo: v?.modelo ?? '' }));
                        }}
                      >
                        <option value="">Selecionar veículo...</option>
                        {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                      <div className="relative">
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                          value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                          <option value="preventiva">Preventiva</option>
                          <option value="corretiva">Corretiva</option>
                          <option value="revisao">Revisão</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Agendada</label>
                      <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={form.data_agendada} onChange={e => setForm(f => ({ ...f, data_agendada: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">KM para Revisão</label>
                    <input type="number" placeholder="Ex: 50000" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.km_agendamento} onChange={e => setForm(f => ({ ...f, km_agendamento: e.target.value }))} />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
                <input type="text" placeholder="Descreva o serviço..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Responsável / Oficina</label>
                <input type="text" placeholder="Nome da oficina ou mecânico" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} />
              </div>
              {editando && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <div className="relative">
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                        <option value="agendada">Agendada</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluida">Concluída</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Realizada</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.data_realizada} onChange={e => setForm(f => ({ ...f, data_realizada: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">KM Realizado</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.km_realizado} onChange={e => setForm(f => ({ ...f, km_realizado: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Custo (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.custo} onChange={e => setForm(f => ({ ...f, custo: e.target.value }))} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                  value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.descricao}
                className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
