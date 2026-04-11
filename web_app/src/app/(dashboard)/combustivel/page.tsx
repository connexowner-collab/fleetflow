"use client";

import { useState, useEffect, useCallback } from 'react';
import { Fuel, Plus, X, TrendingDown, ChevronDown, Trash2 } from 'lucide-react';

interface Abastecimento {
  id: string;
  veiculo_placa: string;
  veiculo_modelo: string | null;
  motorista_nome: string | null;
  data: string;
  tipo_combustivel: string;
  litros: number;
  valor_litro: number;
  valor_total: number;
  km_atual: number;
  km_anterior: number;
  consumo_km_l: string | null;
  posto: string | null;
  observacoes: string | null;
}

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

const TIPO_COLOR: Record<string, string> = {
  diesel:    'bg-gray-100 text-gray-700',
  gasolina:  'bg-yellow-100 text-yellow-700',
  etanol:    'bg-green-100 text-green-700',
  gnv:       'bg-blue-100 text-blue-700',
  eletrico:  'bg-purple-100 text-purple-700',
};

export default function CombustivelPage() {
  const [registros, setRegistros] = useState<Abastecimento[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    veiculo_id: '', veiculo_placa: '', veiculo_modelo: '',
    motorista_nome: '', data: new Date().toISOString().split('T')[0],
    tipo_combustivel: 'diesel', litros: '', valor_litro: '',
    km_atual: '', km_anterior: '', posto: '', observacoes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/combustivel');
    const json = await res.json();
    setRegistros(json.abastecimentos ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/admin/veiculos').then(r => r.json()).then(j => setVeiculos(j.veiculos ?? []));
  }, []);

  const totalLitros  = registros.reduce((s, r) => s + (r.litros ?? 0), 0);
  const totalGasto   = registros.reduce((s, r) => s + (r.valor_total ?? 0), 0);
  const mediaConsumo = registros.filter(r => r.consumo_km_l).reduce((sum, r, _, arr) => sum + parseFloat(r.consumo_km_l ?? '0') / arr.length, 0);

  async function salvar() {
    setSalvando(true);
    const veiculo = veiculos.find(v => v.id === form.veiculo_id);
    await fetch('/api/admin/combustivel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        veiculo_placa: veiculo?.placa ?? form.veiculo_placa,
        veiculo_modelo: veiculo?.modelo ?? form.veiculo_modelo,
      }),
    });
    setSalvando(false);
    setShowForm(false);
    setForm({ veiculo_id: '', veiculo_placa: '', veiculo_modelo: '', motorista_nome: '', data: new Date().toISOString().split('T')[0], tipo_combustivel: 'diesel', litros: '', valor_litro: '', km_atual: '', km_anterior: '', posto: '', observacoes: '' });
    load();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este registro?')) return;
    await fetch(`/api/admin/combustivel?id=${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Fuel className="w-7 h-7 text-brand-primary" /> Combustível
          </h1>
          <p className="text-gray-500 text-sm mt-1">Controle de abastecimento por veículo e motorista</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Registrar Abastecimento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Litros</p>
          <p className="text-3xl font-bold mt-1 text-blue-600">{totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Gasto Total</p>
          <p className="text-3xl font-bold mt-1 text-green-600">
            {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1"><TrendingDown className="w-3 h-3" />Consumo Médio</p>
          <p className="text-3xl font-bold mt-1 text-purple-600">
            {mediaConsumo > 0 ? `${mediaConsumo.toFixed(1)} km/L` : '—'}
          </p>
        </div>
      </div>

      {/* Gráfico de barras simples por veículo */}
      {registros.length > 0 && (() => {
        const byVeiculo: Record<string, number> = {};
        registros.forEach(r => { byVeiculo[r.veiculo_placa] = (byVeiculo[r.veiculo_placa] ?? 0) + r.valor_total; });
        const items = Object.entries(byVeiculo).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const max = items[0]?.[1] ?? 1;
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Custo por Veículo (R$)</h3>
            <div className="space-y-3">
              {items.map(([placa, valor]) => (
                <div key={placa} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-20 flex-shrink-0 font-mono">{placa}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${(valor / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-600 w-20 text-right flex-shrink-0">
                    {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : registros.length === 0 ? (
          <div className="p-12 text-center">
            <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum abastecimento registrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Data', 'Veículo', 'Motorista', 'Combustível', 'Litros', 'R$/L', 'Total', 'KM', 'Consumo', 'Posto', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 text-gray-600">{new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-3 py-3 font-semibold text-gray-900">
                    {r.veiculo_placa}
                    {r.veiculo_modelo && <span className="block text-xs text-gray-400 font-normal">{r.veiculo_modelo}</span>}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{r.motorista_nome || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIPO_COLOR[r.tipo_combustivel] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.tipo_combustivel}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-700">{r.litros?.toFixed(2)} L</td>
                  <td className="px-3 py-3 text-gray-600">{r.valor_litro?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-3 py-3 font-medium text-gray-900">{r.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-3 py-3 text-gray-600">{r.km_atual?.toLocaleString('pt-BR')} km</td>
                  <td className="px-3 py-3">
                    {r.consumo_km_l ? (
                      <span className="text-green-600 font-medium">{r.consumo_km_l} km/L</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-600 max-w-[100px] truncate">{r.posto || '—'}</td>
                  <td className="px-3 py-3">
                    <button onClick={() => excluir(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Registrar Abastecimento</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Veículo *</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.veiculo_id}
                    onChange={e => {
                      const v = veiculos.find(x => x.id === e.target.value);
                      setForm(f => ({ ...f, veiculo_id: e.target.value, veiculo_placa: v?.placa ?? '', veiculo_modelo: v?.modelo ?? '' }));
                    }}>
                    <option value="">Selecionar veículo...</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Combustível</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.tipo_combustivel} onChange={e => setForm(f => ({ ...f, tipo_combustivel: e.target.value }))}>
                      <option value="diesel">Diesel</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="etanol">Etanol</option>
                      <option value="gnv">GNV</option>
                      <option value="eletrico">Elétrico</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Litros *</label>
                  <input type="number" step="0.01" placeholder="0,00" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.litros} onChange={e => setForm(f => ({ ...f, litros: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor por Litro (R$) *</label>
                  <input type="number" step="0.001" placeholder="0,000" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.valor_litro} onChange={e => setForm(f => ({ ...f, valor_litro: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">KM Atual *</label>
                  <input type="number" placeholder="Ex: 52400" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.km_atual} onChange={e => setForm(f => ({ ...f, km_atual: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">KM Anterior</label>
                  <input type="number" placeholder="Para calcular consumo" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.km_anterior} onChange={e => setForm(f => ({ ...f, km_anterior: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motorista</label>
                <input type="text" placeholder="Nome do motorista" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.motorista_nome} onChange={e => setForm(f => ({ ...f, motorista_nome: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Posto</label>
                <input type="text" placeholder="Nome do posto" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.posto} onChange={e => setForm(f => ({ ...f, posto: e.target.value }))} />
              </div>
              {form.litros && form.valor_litro && (
                <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
                  Total: <strong>{(parseFloat(form.litros) * parseFloat(form.valor_litro)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  {form.km_atual && form.km_anterior && parseFloat(form.km_atual) > parseFloat(form.km_anterior) && (
                    <span className="ml-3">Consumo: <strong>{((parseFloat(form.km_atual) - parseFloat(form.km_anterior)) / parseFloat(form.litros)).toFixed(2)} km/L</strong></span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.veiculo_id || !form.litros || !form.valor_litro || !form.km_atual}
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
