"use client";

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Wifi, WifiOff, Zap, ZapOff, RefreshCw, Navigation, Plus, X, ChevronDown } from 'lucide-react';

interface Posicao {
  id: string;
  veiculo_id: string;
  veiculo_placa: string;
  lat: number | null;
  lng: number | null;
  velocidade: number;
  ignicao: boolean;
  odometro: number;
  status: 'online' | 'parado' | 'offline';
  ultima_atualizacao: string;
}

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

const STATUS_CONFIG = {
  online:  { label: 'Online',  color: 'text-green-600 bg-green-50',  dot: 'bg-green-500' },
  parado:  { label: 'Parado',  color: 'text-yellow-600 bg-yellow-50', dot: 'bg-yellow-500' },
  offline: { label: 'Offline', color: 'text-gray-500 bg-gray-100',   dot: 'bg-gray-400' },
};

function formatarTempo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

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

  // Auto-refresh a cada 30 segundos
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        veiculo_id: form.veiculo_id,
        veiculo_placa: veiculo?.placa ?? form.veiculo_placa,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
        velocidade: parseInt(form.velocidade),
        ignicao: form.ignicao === 'true',
        odometro: parseInt(form.odometro),
        status: form.status,
      }),
    });
    setSalvando(false);
    setShowForm(false);
    load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-7 h-7 text-brand-primary" /> Rastreamento
          </h1>
          <p className="text-gray-500 text-sm mt-1">Posição e telemetria dos veículos em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium">
            <Plus className="w-4 h-4" /> Atualizar Posição
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Em Rota</p>
            <p className="text-3xl font-bold text-green-600">{online}</p>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Parado</p>
            <p className="text-3xl font-bold text-yellow-600">{parado}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Offline</p>
            <p className="text-3xl font-bold text-gray-500">{offline}</p>
          </div>
        </div>
      </div>

      {/* Mapa placeholder + lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa simulado */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Navigation className="w-4 h-4" /> Mapa de Frota</span>
            <span className="text-xs text-gray-400">Atualiza automaticamente a cada 30s</span>
          </div>
          <div className="relative bg-slate-100 h-72 flex items-center justify-center overflow-hidden">
            {/* Grade simulando mapa */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="absolute border-b border-slate-400" style={{ top: `${(i + 1) * 12.5}%`, left: 0, right: 0 }} />
              ))}
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="absolute border-r border-slate-400" style={{ left: `${(i + 1) * 12.5}%`, top: 0, bottom: 0 }} />
              ))}
            </div>
            {posicoes.length === 0 ? (
              <div className="text-center z-10">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum veículo rastreado</p>
                <p className="text-gray-300 text-xs mt-1">Integre um GPS tracker via API POST /api/admin/rastreamento</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="grid grid-cols-3 gap-4 p-4">
                  {posicoes.map(p => {
                    const sc = STATUS_CONFIG[p.status];
                    return (
                      <button key={p.id} onClick={() => setSelecionado(p === selecionado ? null : p)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all hover:scale-110 ${selecionado?.id === p.id ? 'ring-2 ring-brand-primary bg-white/80' : 'bg-white/60 hover:bg-white/80'}`}>
                        <div className="relative">
                          <MapPin className={`w-8 h-8 ${p.status === 'online' ? 'text-brand-primary' : p.status === 'parado' ? 'text-yellow-500' : 'text-gray-400'}`} fill="currentColor" />
                          <div className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${sc.dot} border-2 border-white`} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{p.veiculo_placa}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {selecionado && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{selecionado.veiculo_placa}</span>
                <button onClick={() => setSelecionado(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Velocidade</p><p className="font-semibold">{selecionado.velocidade} km/h</p></div>
                <div><p className="text-xs text-gray-400">Odômetro</p><p className="font-semibold">{selecionado.odometro?.toLocaleString('pt-BR')} km</p></div>
                <div><p className="text-xs text-gray-400">Ignição</p>
                  <p className="font-semibold flex items-center gap-1">
                    {selecionado.ignicao ? <><Zap className="w-3 h-3 text-green-500" />Ligada</> : <><ZapOff className="w-3 h-3 text-gray-400" />Desligada</>}
                  </p>
                </div>
                <div><p className="text-xs text-gray-400">Coords</p>
                  <p className="font-mono text-xs">{selecionado.lat ? `${selecionado.lat?.toFixed(4)}, ${selecionado.lng?.toFixed(4)}` : '—'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Última atualização: {formatarTempo(selecionado.ultima_atualizacao)}</p>
            </div>
          )}
        </div>

        {/* Lista de veículos */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">Veículos Monitorados</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : posicoes.length === 0 ? (
            <div className="p-8 text-center">
              <WifiOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhum veículo</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {posicoes.map(p => {
                const sc = STATUS_CONFIG[p.status];
                return (
                  <button key={p.id} onClick={() => setSelecionado(p === selecionado ? null : p)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${selecionado?.id === p.id ? 'bg-brand-primary/5' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-gray-100`}>
                        {p.status === 'online' ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${sc.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{p.veiculo_placa}</p>
                      <p className="text-xs text-gray-400">{p.velocidade} km/h · {formatarTempo(p.ultima_atualizacao)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>{sc.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Integração info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Integração com GPS Tracker</p>
        <p className="text-xs text-blue-600">Envie dados de telemetria via <code className="bg-blue-100 px-1 rounded font-mono">POST /api/admin/rastreamento</code> com os campos: veiculo_id, lat, lng, velocidade, ignicao, odometro, status.</p>
        <p className="text-xs text-blue-600 mt-1">Compatible com Teltonika, Suntech, Queclink, Coban e qualquer dispositivo que suporte HTTP POST.</p>
      </div>

      {/* Modal atualizar posição */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Atualizar Posição</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Veículo *</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Latitude</label>
                  <input type="number" step="0.0000001" placeholder="-23.5505" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Longitude</label>
                  <input type="number" step="0.0000001" placeholder="-46.6333" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Velocidade (km/h)</label>
                  <input type="number" min="0" placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.velocidade} onChange={e => setForm(f => ({ ...f, velocidade: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Odômetro (km)</label>
                  <input type="number" min="0" placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.odometro} onChange={e => setForm(f => ({ ...f, odometro: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="online">Online</option>
                      <option value="parado">Parado</option>
                      <option value="offline">Offline</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ignição</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.ignicao} onChange={e => setForm(f => ({ ...f, ignicao: e.target.value }))}>
                      <option value="true">Ligada</option>
                      <option value="false">Desligada</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || !form.veiculo_id}
                className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
