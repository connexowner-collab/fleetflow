"use client";

import { useState, useEffect } from 'react';
import { BarChart2, Download, TrendingUp, Truck, AlertTriangle, Fuel, Wrench, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface KPI {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; bg: string; text: string;
}

interface BarItem { label: string; value: number; color?: string }

function BarChart({ data, max }: { data: BarItem[]; max: number }) {
  return (
    <div className="space-y-3">
      {data.map(item => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 shrink-0 truncate font-medium" title={item.label}>{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${item.color ?? 'bg-brand-primary'}`}
              style={{ width: max > 0 ? `${(item.value / max) * 100}%` : '0%' }} />
          </div>
          <span className="text-xs font-black text-gray-700 w-8 text-right shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [ocorrenciasPorStatus, setOcorrenciasPorStatus] = useState<BarItem[]>([]);
  const [checklistsPorStatus, setChecklistsPorStatus] = useState<BarItem[]>([]);
  const [veiculosPorStatus, setVeiculosPorStatus] = useState<BarItem[]>([]);
  const [ocorrenciasPorTipo, setOcorrenciasPorTipo] = useState<BarItem[]>([]);
  const [periodo, setPeriodo] = useState('30');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const desde = new Date();
      desde.setDate(desde.getDate() - parseInt(periodo));
      const isoSince = desde.toISOString();

      const [veiculosRes, ocorrRes, checkRes, manutRes] = await Promise.all([
        supabase.from('veiculos').select('id, status'),
        supabase.from('ocorrencias').select('id, status, gravidade, created_at').gte('created_at', isoSince),
        supabase.from('checklists').select('id, status, created_at').gte('created_at', isoSince),
        supabase.from('manutencoes').select('id, status, custo').gte('created_at', isoSince),
      ]);

      const veiculos = veiculosRes.data ?? [];
      const ocorr    = ocorrRes.data ?? [];
      const checks   = checkRes.data ?? [];
      const manut    = manutRes.data ?? [];

      const totalVeiculos   = veiculos.length;
      const emManutencao    = veiculos.filter(v => v.status === 'Em Manutenção').length;
      const ocorrAtivas     = ocorr.filter(o => o.status !== 'Concluída').length;
      const totalGastoManut = manut.reduce((s, m) => s + (m.custo ?? 0), 0);
      const checkAprovados  = checks.filter(c => c.status === 'Aprovado').length;
      const taxaAprovacao   = checks.length > 0 ? Math.round((checkAprovados / checks.length) * 100) : 0;

      setKpis([
        { label: 'Total de Veículos',   value: totalVeiculos,   icon: Truck,         bg: 'bg-blue-50',    text: 'text-brand-primary' },
        { label: 'Em Manutenção',       value: emManutencao,    sub: `${totalVeiculos > 0 ? Math.round((emManutencao/totalVeiculos)*100) : 0}% da frota`, icon: Wrench, bg: 'bg-amber-50', text: 'text-amber-600' },
        { label: 'Ocorrências Ativas',  value: ocorrAtivas,     sub: `${ocorr.length} no período`,  icon: AlertTriangle, bg: 'bg-red-50',     text: 'text-red-600'   },
        { label: 'Custo Manutenção',    value: totalGastoManut.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), sub: `${manut.length} serviços`, icon: Fuel, bg: 'bg-emerald-50', text: 'text-emerald-600' },
        { label: 'Checklists',          value: checks.length,   sub: `${taxaAprovacao}% aprovados`, icon: FileText,       bg: 'bg-indigo-50',  text: 'text-indigo-600'},
        { label: 'Taxa de Aprovação',   value: `${taxaAprovacao}%`, sub: 'checklists',              icon: TrendingUp,     bg: 'bg-purple-50',  text: 'text-purple-600'},
      ]);

      setOcorrenciasPorStatus(['Aberta','Em Tratativa','Concluída'].map(s => ({
        label: s, value: ocorr.filter(o => o.status === s).length,
        color: s === 'Aberta' ? 'bg-red-400' : s === 'Em Tratativa' ? 'bg-amber-400' : 'bg-emerald-400',
      })));

      setOcorrenciasPorTipo(['Grave','Média','Leve'].map(g => ({
        label: g, value: ocorr.filter(o => o.gravidade === g).length,
        color: g === 'Grave' ? 'bg-red-500' : g === 'Média' ? 'bg-amber-500' : 'bg-blue-400',
      })));

      setChecklistsPorStatus(['Aprovado','Recusado','Pendente','Avaria Grave'].map(s => ({
        label: s, value: checks.filter(c => c.status === s).length,
        color: s === 'Aprovado' ? 'bg-emerald-400' : s === 'Recusado' ? 'bg-red-400' : s === 'Avaria Grave' ? 'bg-red-600' : 'bg-amber-400',
      })));

      setVeiculosPorStatus(['Disponível','Em Rota','Em Manutenção','Sinistrado'].map(s => ({
        label: s, value: veiculos.filter(v => v.status === s).length,
        color: s === 'Disponível' ? 'bg-emerald-400' : s === 'Em Rota' ? 'bg-blue-500' : s === 'Em Manutenção' ? 'bg-amber-400' : 'bg-red-400',
      })));

      setLoading(false);
    }
    load();
  }, [periodo]);

  async function exportarCSV() {
    const supabase = createClient();
    const desde = new Date(); desde.setDate(desde.getDate() - parseInt(periodo));
    const [ocorrRes, checkRes] = await Promise.all([
      supabase.from('ocorrencias').select('codigo,motorista_nome,placa,status,gravidade,created_at').gte('created_at', desde.toISOString()),
      supabase.from('checklists').select('codigo,motorista_nome,placa,status,created_at').gte('created_at', desde.toISOString()),
    ]);
    const csv = [
      '=== OCORRÊNCIAS ===', 'Código,Motorista,Placa,Status,Gravidade,Data',
      ...(ocorrRes.data ?? []).map(r => `${r.codigo},${r.motorista_nome},${r.placa},${r.status},${r.gravidade},${new Date(r.created_at).toLocaleDateString('pt-BR')}`),
      '', '=== CHECKLISTS ===', 'Código,Motorista,Placa,Status,Data',
      ...(checkRes.data ?? []).map(r => `${r.codigo},${r.motorista_nome},${r.placa},${r.status},${new Date(r.created_at).toLocaleDateString('pt-BR')}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fleetflow-relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const maxOcorr  = Math.max(...ocorrenciasPorStatus.map(i => i.value), 1);
  const maxChecks = Math.max(...checklistsPorStatus.map(i => i.value), 1);
  const maxVeics  = Math.max(...veiculosPorStatus.map(i => i.value), 1);
  const maxGrav   = Math.max(...ocorrenciasPorTipo.map(i => i.value), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Relatórios & BI</h1>
          <p className="text-sm text-gray-400 mt-0.5">KPIs operacionais e exportação de dados</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-2xl pl-3 pr-8 py-2.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer">
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="365">1 ano</option>
            </select>
            <BarChart2 className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-3.5 pointer-events-none" />
          </div>
          <button onClick={exportarCSV}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className={`${kpi.bg} rounded-2xl border border-gray-100 p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight">{kpi.label}</p>
                  <Icon className={`w-4 h-4 ${kpi.text} shrink-0`} />
                </div>
                <p className={`text-2xl font-black ${kpi.text}`}>{kpi.value}</p>
                {kpi.sub && <p className="text-[10px] text-gray-400 mt-1 font-medium">{kpi.sub}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Charts 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: 'Ocorrências por Status',    data: ocorrenciasPorStatus, max: maxOcorr  },
          { title: 'Ocorrências por Gravidade', data: ocorrenciasPorTipo,   max: maxGrav   },
          { title: 'Checklists por Status',     data: checklistsPorStatus,  max: maxChecks },
          { title: 'Frota por Status',          data: veiculosPorStatus,    max: maxVeics  },
        ].map(chart => (
          <div key={chart.title} className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-black text-gray-800 mb-4">{chart.title}</h3>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded-full animate-pulse" />)}
              </div>
            ) : (
              <BarChart data={chart.data} max={chart.max} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
