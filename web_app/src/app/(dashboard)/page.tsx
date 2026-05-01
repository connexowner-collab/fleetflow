"use client";

import { AlertTriangle, Tag, Eye, Truck, Wrench, X, CheckCircle, ChevronRight, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

type Occurrence = { placa: string; motorista: string; gravidade: string; data: string; badgeClass: string; status: string; id: string }

const GRAV_STYLE: Record<string, { pill: string; dot: string }> = {
  Grave: { pill: 'bg-red-100 text-red-700',    dot: 'bg-red-500'    },
  Média: { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400'  },
  Leve:  { pill: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

export default function Dashboard() {
  const [toast, setToast] = useState<string | null>(null);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [newPlaca, setNewPlaca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [metrics, setMetrics] = useState({ totalVeiculos: 0, emManutencao: 0, ocorrenciasAtivas: 0, gravesNaoTratadas: 0, trocasPendentes: 0 });
  const [recentOccurrences, setRecentOccurrences] = useState<Occurrence[]>([]);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const [metricsRes, ocRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        supabase.from('ocorrencias').select('id, codigo, placa, motorista_nome, gravidade, status, created_at').order('created_at', { ascending: false }).limit(6),
      ]);
      setMetrics({
        totalVeiculos: metricsRes.totalVeiculos ?? 0,
        emManutencao: metricsRes.emManutencao ?? 0,
        ocorrenciasAtivas: metricsRes.ocorrenciasAtivas ?? 0,
        gravesNaoTratadas: metricsRes.gravesNaoTratadas ?? 0,
        trocasPendentes: metricsRes.trocasPendentes ?? 0,
      });
      const gravBadge: Record<string, string> = { Grave: 'bg-red-100 text-red-700', Média: 'bg-yellow-100 text-yellow-700', Leve: 'bg-green-100 text-green-700' };
      setRecentOccurrences(
        (ocRes.data ?? []).map((o) => ({
          id: o.codigo ?? o.id, placa: o.placa ?? '', motorista: o.motorista_nome ?? '',
          gravidade: o.gravidade, data: new Date(o.created_at).toLocaleDateString('pt-BR'),
          badgeClass: gravBadge[o.gravidade] ?? 'bg-gray-100 text-gray-700', status: o.status,
        }))
      );
    }
    load();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleNovoVeiculo = async () => {
    if (!newPlaca || !newModelo) { showToast('⚠️ Placa e Modelo são obrigatórios.'); return; }
    const supabase = createClient();
    const { error } = await supabase.from('veiculos').insert({ placa: newPlaca.toUpperCase(), modelo: newModelo, status: 'Disponível' });
    setIsNewVehicleOpen(false); setNewPlaca(''); setNewModelo('');
    if (error) showToast(`⚠️ Erro ao cadastrar: ${error.message}`);
    else showToast(`✅ Veículo ${newPlaca.toUpperCase()} adicionado!`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-right flex items-center gap-2">
          {toast}
        </div>
      )}

      {/* Modal novo veículo */}
      {isNewVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsNewVehicleOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom duration-300">
            {/* Handle bar mobile */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
            <button onClick={() => setIsNewVehicleOpen(false)} className="absolute top-5 right-5 p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Novo Veículo</h2>
                <p className="text-xs text-gray-400">Cadastro rápido da frota</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Placa <span className="text-red-500">*</span></label>
                <input type="text" value={newPlaca} onChange={(e) => setNewPlaca(e.target.value)} placeholder="ex: MNO-3456"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary uppercase transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Modelo <span className="text-red-500">*</span></label>
                <input type="text" value={newModelo} onChange={(e) => setNewModelo(e.target.value)} placeholder="ex: Volvo FH 460"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsNewVehicleOpen(false)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleNovoVeiculo} className="flex-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-primary/20">
                <CheckCircle className="w-4 h-4" /> Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-sm text-gray-400 mt-0.5">Operação em tempo real</p>
        </div>
        <button onClick={() => setIsNewVehicleOpen(true)}
          className="flex items-center gap-2 bg-brand-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Novo Veículo</span>
        </button>
      </div>

      {/* Bento Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Total Veículos — Destaque */}
        <div className="col-span-2 lg:col-span-1 relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-brand-primary to-blue-700 text-white shadow-lg shadow-brand-primary/20">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Truck className="w-24 h-24" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-75 mb-2">Total de Veículos</p>
          <p className="text-5xl font-black leading-none mb-1">{metrics.totalVeiculos}</p>
          <p className="text-xs opacity-70 font-medium">na frota ativa</p>
        </div>

        {/* Ocorrências Ativas */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${metrics.ocorrenciasAtivas > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <AlertTriangle className={`w-16 h-16 ${metrics.ocorrenciasAtivas > 0 ? 'text-red-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Ocorrências</p>
          <p className={`text-4xl font-black leading-none mb-1 ${metrics.ocorrenciasAtivas > 0 ? 'text-red-600' : 'text-gray-900'}`}>{metrics.ocorrenciasAtivas}</p>
          <p className={`text-xs font-semibold ${metrics.gravesNaoTratadas > 0 ? 'text-red-500' : 'text-gray-400'}`}>{metrics.gravesNaoTratadas} graves</p>
        </div>

        {/* Trocas Pendentes */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${metrics.trocasPendentes > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <Tag className={`w-16 h-16 ${metrics.trocasPendentes > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Aprovações</p>
          <p className={`text-4xl font-black leading-none mb-1 ${metrics.trocasPendentes > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{metrics.trocasPendentes}</p>
          <p className="text-xs text-gray-400 font-medium">trocas pendentes</p>
        </div>

        {/* Em Manutenção */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all ${metrics.emManutencao > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'}`}>
          <div className="absolute -right-3 -bottom-3 opacity-10">
            <Wrench className={`w-16 h-16 ${metrics.emManutencao > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Manutenção</p>
          <p className={`text-4xl font-black leading-none mb-1 ${metrics.emManutencao > 0 ? 'text-blue-600' : 'text-gray-900'}`}>{metrics.emManutencao}</p>
          <p className="text-xs text-gray-400 font-medium">em oficina</p>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Últimas Ocorrências */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Últimas Ocorrências</h2>
            <Link href="/ocorrencias" className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:gap-2 transition-all">
              Ver todas <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOccurrences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckCircle className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Sem ocorrências recentes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentOccurrences.map((item, idx) => {
                const style = GRAV_STYLE[item.gravidade] ?? { pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
                return (
                  <Link href="/ocorrencias" key={idx}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/80 transition-colors group">
                    {/* Severity dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-800">{item.placa}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.pill}`}>{item.gravidade}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{item.motorista}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{item.data}</p>
                      <Eye className="w-4 h-4 text-gray-300 group-hover:text-brand-primary mt-1 ml-auto transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Central de Tarefas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Tarefas Pendentes</h2>
          <div className="space-y-3">
            {metrics.gravesNaoTratadas > 0 && (
              <Link href="/ocorrencias" className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors group">
                <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-red-900 leading-tight">Ocorrências Graves</p>
                  <p className="text-xs text-red-600 mt-0.5">{metrics.gravesNaoTratadas} sem tratativa</p>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 mt-0.5 ml-auto shrink-0" />
              </Link>
            )}

            {metrics.trocasPendentes > 0 && (
              <Link href="/admin/trocas" className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-colors group">
                <div className="w-8 h-8 bg-amber-100 group-hover:bg-amber-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <Tag className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-900 leading-tight">Trocas para Aprovar</p>
                  <p className="text-xs text-amber-600 mt-0.5">{metrics.trocasPendentes} aguardando</p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 ml-auto shrink-0" />
              </Link>
            )}

            {metrics.emManutencao > 0 && (
              <Link href="/frota" className="flex items-start gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors group">
                <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                  <Wrench className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-blue-900 leading-tight">Em Manutenção</p>
                  <p className="text-xs text-blue-600 mt-0.5">{metrics.emManutencao} veículo(s)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 ml-auto shrink-0" />
              </Link>
            )}

            <Link href="/checklists" className="flex items-start gap-3 p-3.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors group">
              <div className="w-8 h-8 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                <CheckCircle className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800 leading-tight">Inspeções Diárias</p>
                <p className="text-xs text-gray-400 mt-0.5">Validar checklists</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5 ml-auto shrink-0" />
            </Link>

            {metrics.gravesNaoTratadas === 0 && metrics.trocasPendentes === 0 && metrics.emManutencao === 0 && (
              <div className="flex flex-col items-center py-6 text-gray-300">
                <CheckCircle className="w-8 h-8 mb-2" />
                <p className="text-xs font-medium text-gray-400">Tudo em dia!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
