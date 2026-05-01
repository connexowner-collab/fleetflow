"use client";

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Wifi, WifiOff, Zap, ZapOff, RefreshCw, Navigation, Plus, X, ChevronDown } from 'lucide-react';

interface Posicao {
  id: string; veiculo_id: string; veiculo_placa: string;
  lat: number | null; lng: number | null; velocidade: number; ignicao: boolean;
  odometro: number; status: 'online' | 'parado' | 'offline'; ultima_atualizacao: string;
}

interface Veiculo { id: string; placa: string; modelo: string }

const STATUS_CONFIG = {
  online:  { label: 'Em Rota',  color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-100' },
  parado:  { label: 'Parado',   color: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500',   border: 'border-amber-100'   },
  offline: { label: 'Offline',  color: 'bg-gray-100 text-gray-500',       dot: 'bg-gray-400',    border: 'border-gray-100'    },
};

function formatarTempo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all';

export default function RastreamentoPage() {
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionado, setSelecionado] = useState<Posicao | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    veiculo_id: '', veiculo_placa: '', lat: '', lng: '',
    velocidade: '0', ignicao: 'false', odometro: '0', status: 'offline',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/rastreamento');
    const json = await res.json();
    setPosicoes(json.posicoes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/admin/veiculos').then(r => r.json()).then(j => setVeiculos(j.veiculos ?? []));
  }, []);
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const online  = posicoes.filter(p => p.status === 'online').length;
  const parado  = posicoes.filter(p => p.status === 'parado').length;
  const offline = posicoes.filter(p => p.status === 'offline').length;

  async function salvar() {
    setSalvando(true);
    const veiculo = veiculos.find(v => v.id === form.veiculo_id);
    await fetch('/api/admin/rastreamento', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        veiculo_id: form.veiculo_id, veiculo_placa: veiculo?.placa ?? form.veiculo_placa,
        lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null,
        velocidade: parseInt(form.velocidade), ignicao: form.ignicao === 'true',
        odometro: parseInt(form.odometro), status: form.status,
      }),
    });
    setSalvando(false); setShowForm(false); load();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Rastreamento</h1>
          <p className="text-sm text-gray-400 mt-0.5">Posição e telemetria dos veículos em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors text-sm font-bold">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Posição</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs text-emerald-600 font-bold">Em Rota</p>
          </div>
          <p className="text-2xl font-black text-emerald-700">{online}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <p className="text-xs text-amber-600 font-bold">Parado</p>
          </div>
          <p className="text-2xl font-black text-amber-700">{parado}</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-gray-400" />
            <p className="text-xs text-gray-500 font-bold">Offline</p>
          </div>
          <p className="text-2xl font-black text-gray-600">{offline}</p>
        </div>
      </div>

      {/* Map + list grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Map placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-black text-gray-800 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-brand-primary" /> Mapa de Frota
            </span>
            <span className="text-[10px] text-gray-400 font-medium">Auto-atualiza a cada 30s</span>
          </div>

          <div className="relative bg-slate-50 h-72 flex items-center justify-center overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 opacity-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`h${i}`} className="absolute border-b border-slate-500" style={{ top: `${(i + 1) * 12.5}%`, left: 0, right: 0 }} />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`v${i}`} className="absolute border-r border-slate-500" style={{ left: `${(i + 1) * 12.5}%`, top: 0, bottom: 0 }} />
              ))}
            </div>

            {posicoes.length === 0 ? (
              <div className="text-center z-10">
                <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">Nenhum veículo rastreado</p>
                <p className="text-xs text-gray-300 mt-1">Integre via POST /api/admin/rastreamento</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-wrap gap-3 p-4 justify-center">
                  {posicoes.map(p => {
                    const sc = STATUS_CONFIG[p.status];
                    return (
                      <button key={p.id} onClick={() => setSelecionado(p === selecionado ? null : p)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all hover:scale-110 ${
                          selecionado?.id === p.id ? 'ring-2 ring-brand-primary bg-white shadow-lg' : 'bg-white/70 hover:bg-white shadow-sm'
                        }`}>
                        <div className="relative">
                          <MapPin className={`w-7 h-7 ${p.status === 'online' ? 'text-brand-primary' : p.status === 'parado' ? 'text-amber-500' : 'text-gray-400'}`} fill="currentColor" />
                          <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${sc.dot} border-2 border-white ${p.status === 'online' ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className="text-xs font-black text-gray-800">{p.veiculo_placa}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected vehicle detail */}
          {selecionado && (
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className="font-black text-gray-900">{selecionado.veiculo_placa}</span>
                <button onClick={() => setSelecionado(null)} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Velocidade', value: `${selecionado.velocidade} km/h` },
                  { label: 'Odômetro', value: `${selecionado.odometro?.toLocaleString('pt-BR')} km` },
                  { label: 'Ignição', value: selecionado.ignicao ? 'Ligada' : 'Desligada', icon: selecionado.ignicao ? Zap : ZapOff, iconColor: selecionado.ignicao ? 'text-emerald-500' : 'text-gray-400' },
                  { label: 'Coords', value: selecionado.lat ? `${selecionado.lat?.toFixed(3)}, ${selecionado.lng?.toFixed(3)}` : '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">{item.label}</p>
                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      {'icon' in item && item.icon && <item.icon className={`w-3 h-3 ${item.iconColor}`} />}
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Atualizado: {formatarTempo(selecionado.ultima_atualizacao)}</p>
            </div>
          )}
        </div>

        {/* Vehicle list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-black text-gray-800">Veículos Monitorados</p>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : posicoes.length === 0 ? (
            <div className="p-8 text-center">
              <WifiOff className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">Nenhum veículo</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 lg:max-h-none overflow-y-auto">
              {posicoes.map(p => {
                const sc = STATUS_CONFIG[p.status];
                return (
                  <button key={p.id} onClick={() => setSelecionado(p === selecionado ? null : p)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selecionado?.id === p.id ? 'bg-brand-primary/5' : ''}`}>
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                        {p.status === 'online' ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${sc.dot} ${p.status === 'online' ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{p.veiculo_placa}</p>
                      <p className="text-xs text-gray-400">{p.velocidade} km/h · {formatarTempo(p.ultima_atualizacao)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Integration info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <Navigation className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800 mb-1">Integração com GPS Tracker</p>
          <p className="text-xs text-blue-600">Envie dados via <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">POST /api/admin/rastreamento</code> com os campos: veiculo_id, lat, lng, velocidade, ignicao, odometro, status.</p>
          <p className="text-xs text-blue-500 mt-1">Compatível com Teltonika, Suntech, Queclink, Coban e qualquer dispositivo com HTTP POST.</p>
        </div>
      </div>

      {/* Modal / bottom sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-brand-primary" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Atualizar Posição</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Veículo *</label>
                <div className="relative">
                  <select className={inputCls + ' appearance-none pr-8'}
                    value={form.veiculo_id}
                    onChange={e => { const v = veiculos.find(x => x.id === e.target.value); setForm(f => ({ ...f, veiculo_id: e.target.value, veiculo_placa: v?.placa ?? '' })); }}>
                    <option value="">Selecionar veículo...</option>
                    {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Latitude</label>
                  <input type="number" step="0.0000001" placeholder="-23.5505" className={inputCls}
                    value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Longitude</label>
                  <input type="number" step="0.0000001" placeholder="-46.6333" className={inputCls}
                    value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Velocidade (km/h)</label>
                  <input type="number" min="0" placeholder="0" className={inputCls}
                    value={form.velocidade} onChange={e => setForm(f => ({ ...f, velocidade: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Odômetro (km)</label>
                  <input type="number" min="0" placeholder="0" className={inputCls}
                    value={form.odometro} onChange={e => setForm(f => ({ ...f, odometro: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <div className="relative">
                    <select className={inputCls + ' appearance-none pr-8'} value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="online">Em Rota</option>
                      <option value="parado">Parado</option>
                      <option value="offline">Offline</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Ignição</label>
                  <div className="relative">
                    <select className={inputCls + ' appearance-none pr-8'} value={form.ignicao}
                      onChange={e => setForm(f => ({ ...f, ignicao: e.target.value }))}>
                      <option value="true">Ligada</option>
                      <option value="false">Desligada</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || !form.veiculo_id}
                className="flex-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                {salvando ? 'Salvando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
