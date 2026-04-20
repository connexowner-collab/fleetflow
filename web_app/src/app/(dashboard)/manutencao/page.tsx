"use client";

import { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, X, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown, User, PlayCircle, Ban } from 'lucide-react';

interface Manutencao {
  id: string;
  codigo: string | null;
  veiculo_placa: string;
  veiculo_modelo: string | null;
  motorista_nome: string | null;
  tipo: string;
  motivo: string | null;
  descricao: string;
  status: string;
  urgencia: string | null;
  data_agendada: string | null;
  data_realizada: string | null;
  km_agendamento: number | null;
  km_atual: number | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  agendada:               { label: 'Agendada',              color: 'text-blue-600 bg-blue-50',     icon: Clock },
  em_andamento:           { label: 'Em Andamento',          color: 'text-yellow-600 bg-yellow-50', icon: AlertCircle },
  aguardando_atendimento: { label: 'Aguardando Atendimento', color: 'text-orange-600 bg-orange-50', icon: Clock },
  aguardando_manutencao:  { label: 'Aguardando Manutenção', color: 'text-purple-600 bg-purple-50', icon: Clock },
  em_manutencao:          { label: 'Em Manutenção',         color: 'text-yellow-700 bg-yellow-100', icon: Wrench },
  concluida:              { label: 'Concluída',             color: 'text-green-600 bg-green-50',   icon: CheckCircle },
  cancelada:              { label: 'Cancelada',             color: 'text-gray-500 bg-gray-100',    icon: XCircle },
  recusado:               { label: 'Recusado',              color: 'text-red-600 bg-red-50',       icon: Ban },
  manutencao_reprovada:   { label: 'Reprovada',             color: 'text-red-700 bg-red-100',      icon: XCircle },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-500 bg-gray-100', icon: Clock };
}

const URGENCIA_COLOR: Record<string, string> = {
  muito_alta: 'bg-red-100 text-red-700',
  alta:       'bg-orange-100 text-orange-700',
  media:      'bg-yellow-100 text-yellow-700',
  baixa:      'bg-green-100 text-green-700',
};

const URGENCIA_LABEL: Record<string, string> = {
  muito_alta: 'Muito Alta',
  alta:       'Alta',
  media:      'Média',
  baixa:      'Baixa',
};

const TIPO_COLOR: Record<string, string> = {
  preventiva: 'bg-brand-secondary/10 text-brand-secondary',
  corretiva:  'bg-red-100 text-red-700',
  revisao:    'bg-purple-100 text-purple-700',
};

const TIPO_LABEL: Record<string, string> = {
  preventiva: 'Preventiva',
  corretiva:  'Corretiva',
  revisao:    'Revisão',
};

const FILTROS = [
  { value: 'all',                  label: 'Todos' },
  { value: 'aguardando_atendimento', label: 'Aguardando Atendimento' },
  { value: 'aguardando_manutencao',  label: 'Aguardando Manutenção' },
  { value: 'em_manutencao',          label: 'Em Manutenção' },
  { value: 'agendada',               label: 'Agendada' },
  { value: 'em_andamento',           label: 'Em Andamento' },
  { value: 'concluida',              label: 'Concluída' },
  { value: 'cancelada',              label: 'Cancelada' },
  { value: 'recusado',               label: 'Recusado' },
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
          descricao: form.descricao,
          data_realizada: form.data_realizada || null,
          km_realizado: form.km_realizado ? parseInt(form.km_realizado) : null,
          custo: form.custo ? parseFloat(form.custo) : null,
          responsavel: form.responsavel || null,
          observacoes: form.observacoes || null,
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

  async function acao(id: string, tipo: string, observacao?: string) {
    setActionLoading(id + tipo);
    await fetch('/api/admin/manutencao', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, acao: tipo, observacao }),
    });
    setActionLoading(null);
    load();
  }

  async function handleIniciar(m: Manutencao) {
    await acao(m.id, 'iniciar');
  }

  async function handleConfirmarEntrada(m: Manutencao) {
    await acao(m.id, 'confirmar_entrada');
  }

  async function handleConcluir(m: Manutencao) {
    const obs = prompt('Observação de conclusão (opcional):');
    await acao(m.id, 'concluir', obs ?? undefined);
  }

  async function handleRecusar(m: Manutencao) {
    const obs = prompt('Motivo da recusa (obrigatório):');
    if (!obs?.trim()) return;
    await acao(m.id, 'recusar', obs.trim());
  }

  async function handleCancelar(m: Manutencao) {
    if (!confirm('Cancelar esta manutenção?')) return;
    await acao(m.id, 'cancelar');
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta manutenção?')) return;
    await fetch(`/api/admin/manutencao?id=${id}`, { method: 'DELETE' });
    load();
  }

  const pendentes  = manutencoes.filter(m => m.status === 'aguardando_atendimento').length;
  const emCurso    = manutencoes.filter(m => ['aguardando_manutencao','em_manutencao','em_andamento'].includes(m.status)).length;
  const concluidas = manutencoes.filter(m => m.status === 'concluida').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-brand-primary" /> Manutenção
          </h1>
          <p className="text-gray-500 text-sm mt-1">Solicitações dos motoristas e agendamentos internos</p>
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
          { label: 'Pendentes',    value: pendentes,  color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Em Andamento', value: emCurso,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Concluídas',   value: concluidas, color: 'text-green-600',  bg: 'bg-green-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltroStatus(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filtroStatus === f.value
                ? 'bg-brand-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Código', 'Veículo / Motorista', 'Motivo / Tipo', 'Descrição', 'KM', 'Urgência', 'Status', 'Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {manutencoes.map(m => {
                  const sc = getStatusConfig(m.status);
                  const Icon = sc.icon;
                  const isLoading = actionLoading?.startsWith(m.id);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {m.codigo ?? '—'}
                        <span className="block text-gray-400">
                          {new Date(m.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{m.veiculo_placa}</p>
                        {m.veiculo_modelo && <p className="text-xs text-gray-400">{m.veiculo_modelo}</p>}
                        {m.motorista_nome && (
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />{m.motorista_nome}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {m.motivo && <p className="text-gray-700 font-medium">{m.motivo}</p>}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${TIPO_COLOR[m.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                          {TIPO_LABEL[m.tipo] ?? m.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">
                        <p className="line-clamp-2">{m.descricao}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {(m.km_atual ?? m.km_agendamento)
                          ? `${(m.km_atual ?? m.km_agendamento)!.toLocaleString('pt-BR')} km`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {m.urgencia ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENCIA_COLOR[m.urgencia] ?? 'bg-gray-100 text-gray-600'}`}>
                            {URGENCIA_LABEL[m.urgencia] ?? m.urgencia}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                          <Icon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 min-w-[120px]">
                          {m.status === 'aguardando_atendimento' && (
                            <>
                              <button disabled={isLoading} onClick={() => handleIniciar(m)}
                                className="px-2 py-1 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center gap-1 disabled:opacity-50">
                                <PlayCircle className="w-3 h-3" />Iniciar
                              </button>
                              <button disabled={isLoading} onClick={() => handleRecusar(m)}
                                className="px-2 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium">
                                Recusar
                              </button>
                            </>
                          )}
                          {m.status === 'aguardando_manutencao' && (
                            <>
                              <button disabled={isLoading} onClick={() => handleConfirmarEntrada(m)}
                                className="px-2 py-1 text-xs rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium">
                                Em Manutenção
                              </button>
                              <button disabled={isLoading} onClick={() => handleCancelar(m)}
                                className="px-2 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium">
                                Cancelar
                              </button>
                            </>
                          )}
                          {m.status === 'em_manutencao' && (
                            <button disabled={isLoading} onClick={() => handleConcluir(m)}
                              className="px-2 py-1 text-xs rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium flex items-center gap-1 disabled:opacity-50">
                              <CheckCircle className="w-3 h-3" />Concluir
                            </button>
                          )}
                          {['agendada', 'em_andamento'].includes(m.status) && (
                            <button onClick={() => abrirForm(m)}
                              className="px-2 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium">
                              Editar
                            </button>
                          )}
                          {!['concluida','cancelada','recusado','manutencao_reprovada'].includes(m.status) && (
                            <button onClick={() => excluir(m.id)}
                              className="px-2 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium">
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova/Editar */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Realizada</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.data_realizada} onChange={e => setForm(f => ({ ...f, data_realizada: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">KM Realizado</label>
                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.km_realizado} onChange={e => setForm(f => ({ ...f, km_realizado: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
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
