"use client";

import { useState, useEffect, useCallback } from 'react';
import { Fuel, Plus, X, TrendingDown, ChevronDown, Trash2, User, Gauge } from 'lucide-react';

interface Abastecimento {
  id: string; veiculo_placa: string; veiculo_modelo: string | null;
  motorista_nome: string | null; data: string; tipo_combustivel: string;
  litros: number; valor_litro: number; valor_total: number;
  km_atual: number; km_anterior: number; consumo_km_l: string | null;
  posto: string | null; observacoes: string | null;
}
interface Veiculo { id: string; placa: string; modelo: string; }

const TIPO_COLOR: Record<string, string> = {
  diesel:   'bg-gray-100 text-gray-700',
  gasolina: 'bg-amber-100 text-amber-700',
  etanol:   'bg-emerald-100 text-emerald-700',
  gnv:      'bg-blue-100 text-blue-700',
  eletrico: 'bg-purple-100 text-purple-700',
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
    await fetch('/api/admin/combustivel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, veiculo_placa: veiculo?.placa ?? form.veiculo_placa, veiculo_modelo: veiculo?.modelo ?? form.veiculo_modelo }) });
    setSalvando(false); setShowForm(false);
    setForm({ veiculo_id: '', veiculo_placa: '', veiculo_modelo: '', motorista_nome: '', data: new Date().toISOString().split('T')[0], tipo_combustivel: 'diesel', litros: '', valor_litro: '', km_atual: '', km_anterior: '', posto: '', observacoes: '' });
    load();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este registro?')) return;
    await fetch(`/api/admin/combustivel?id=${id}`, { method: 'DELETE' });
    load();
  }

  const totalPreview = form.litros && form.valor_litro ? parseFloat(form.litros) * parseFloat(form.valor_litro) : 0;
  const consumoPreview = form.km_atual && form.km_anterior && form.litros && parseFloat(form.km_atual) > parseFloat(form.km_anterior)
    ? (parseFloat(form.km_atual) - parseFloat(form.km_anterior)) / parseFloat(form.litros) : 0;

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all";

  // Top 6 veículos por gasto
  const byVeiculo: Record<string, number> = {};
  registros.forEach(r => { byVeiculo[r.veiculo_placa] = (byVeiculo[r.veiculo_placa] ?? 0) + r.valor_total; });
  const topVeiculos = Object.entries(byVeiculo).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxGasto = topVeiculos[0]?.[1] ?? 1;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Combustível</h1>
          <p className="text-sm text-gray-400 mt-0.5">Controle de abastecimento da frota</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Registrar</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-brand-primary to-blue-700 rounded-2xl p-4 text-white shadow-lg shadow-brand-primary/20">
          <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Total Litros</p>
          <p className="text-2xl font-black">{totalLitros.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">Gasto Total</p>
          <p className="text-xl font-black text-emerald-700">{totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" />Consumo</p>
          <p className="text-xl font-black text-purple-700">{mediaConsumo > 0 ? `${mediaConsumo.toFixed(1)} km/L` : '—'}</p>
        </div>
      </div>

      {/* Gráfico custo por veículo */}
      {topVeiculos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Custo por Veículo</h3>
          <div className="space-y-3">
            {topVeiculos.map(([placa, valor]) => (
              <div key={placa} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-20 shrink-0 font-mono font-bold">{placa}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-primary to-blue-500 rounded-full transition-all" style={{ width: `${(valor / maxGasto) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600 w-20 text-right shrink-0">
                  {valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de abastecimentos */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Histórico de Abastecimentos</h3>
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
          </div>
        ) : registros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Fuel className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Nenhum abastecimento registrado</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {registros.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 p-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <Fuel className="w-5 h-5 text-brand-primary" />
                  </div>
                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 text-sm">{r.veiculo_placa}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${TIPO_COLOR[r.tipo_combustivel] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.tipo_combustivel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      {r.motorista_nome && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.motorista_nome}</span>}
                      <span className="flex items-center gap-1"><Gauge className="w-3 h-3" />{r.km_atual?.toLocaleString('pt-BR')} km</span>
                      {r.consumo_km_l && <span className="text-emerald-600 font-semibold">{r.consumo_km_l} km/L</span>}
                      {r.posto && <span>📍 {r.posto}</span>}
                    </div>
                  </div>
                  {/* Values */}
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">{r.valor_total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p className="text-xs text-gray-400">{r.litros?.toFixed(2)} L · {new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  {/* Delete */}
                  <button onClick={() => excluir(r.id)} className="p-2 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors ml-1 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                    <Fuel className="w-4 h-4 text-brand-primary" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900">Registrar Abastecimento</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Veículo *</label>
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
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data *</label>
                  <input type="date" className={inputCls} value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Combustível</label>
                  <div className="relative">
                    <select className={inputCls + " appearance-none pr-8"} value={form.tipo_combustivel} onChange={e => setForm(f => ({ ...f, tipo_combustivel: e.target.value }))}>
                      <option value="diesel">Diesel</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="etanol">Etanol</option>
                      <option value="gnv">GNV</option>
                      <option value="eletrico">Elétrico</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Litros *</label>
                  <input type="number" step="0.01" placeholder="0,00" className={inputCls} value={form.litros} onChange={e => setForm(f => ({ ...f, litros: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Valor/Litro (R$) *</label>
                  <input type="number" step="0.001" placeholder="0,000" className={inputCls} value={form.valor_litro} onChange={e => setForm(f => ({ ...f, valor_litro: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">KM Atual *</label>
                  <input type="number" placeholder="Ex: 52400" className={inputCls} value={form.km_atual} onChange={e => setForm(f => ({ ...f, km_atual: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">KM Anterior</label>
                  <input type="number" placeholder="Para calcular consumo" className={inputCls} value={form.km_anterior} onChange={e => setForm(f => ({ ...f, km_anterior: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Motorista</label>
                <input type="text" placeholder="Nome do motorista" className={inputCls} value={form.motorista_nome} onChange={e => setForm(f => ({ ...f, motorista_nome: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Posto</label>
                <input type="text" placeholder="Nome do posto" className={inputCls} value={form.posto} onChange={e => setForm(f => ({ ...f, posto: e.target.value }))} />
              </div>

              {/* Preview */}
              {totalPreview > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold">Total estimado</span>
                  <div className="text-right">
                    <span className="font-black text-emerald-700">{totalPreview.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    {consumoPreview > 0 && <span className="block text-[10px] text-emerald-600">{consumoPreview.toFixed(2)} km/L</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.veiculo_id || !form.litros || !form.valor_litro || !form.km_atual}
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
