"use client";

import { useState, useEffect } from 'react';
import { BarChart2, Download, TrendingUp, Truck, AlertTriangle, Fuel, Wrench, FileText } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface KPI {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

function BarChart({ data, max, color = 'bg-brand-primary' }: { data: BarItem[]; max: number; color?: string }) {
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate" title={item.label}>{item.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${item.color ?? color}`}
              style={{ width: max > 0 ? `${(item.value / max) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-gray-700 w-16 text-right flex-shrink-0 font-medium">{item.value.toLocaleString('pt-BR')}</span>
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

      // KPIs
      const totalVeiculos    = veiculos.length;
      const emManutencao     = veiculos.filter(v => v.status === 'Em Manutenção').length;
      const ocorrAtivas      = ocorr.filter(o => o.status !== 'Concluída').length;
      const totalGastoManut  = manut.reduce((s, m) => s + (m.custo ?? 0), 0);
      const checkAprovados   = checks.filter(c => c.status === 'Aprovado').length;
      const taxaAprovacao    = checks.length > 0 ? Math.round((checkAprovados / checks.length) * 100) : 0;

      setKpis([
        { label: 'Total de Veículos', value: totalVeiculos, icon: Truck, color: 'text-brand-primary' },
        { label: 'Em Manutenção', value: emManutencao, sub: `${totalVeiculos > 0 ? Math.round((emManutencao / totalVeiculos) * 100) : 0}% da frota`, icon: Wrench, color: 'text-yellow-600' },
        { label: 'Ocorrências Ativas', value: ocorrAtivas, sub: `${ocorr.length} no período`, icon: AlertTriangle, color: 'text-red-600' },
        { label: 'Custo Manutenção', value: totalGastoManut.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), sub: `${manut.length} serviços`, icon: Fuel, color: 'text-green-600' },
        { label: 'Checklists', value: checks.length, sub: `${taxaAprovacao}% aprovados`, icon: FileText, color: 'text-blue-600' },
        { label: 'Taxa de Aprovação', value: `${taxaAprovacao}%`, sub: 'checklists', icon: TrendingUp, color: 'text-purple-600' },
      ]);

      // Gráficos
      const statusOcorr = ['Aberta', 'Em Tratativa', 'Concluída'];
      setOcorrenciasPorStatus(statusOcorr.map(s => ({
        label: s, value: ocorr.filter(o => o.status === s).length,
        color: s === 'Aberta' ? 'bg-red-400' : s === 'Em Tratativa' ? 'bg-yellow-400' : 'bg-green-400',
      })));

      const gravidadeOcorr = ['Grave', 'Média', 'Leve'];
      setOcorrenciasPorTipo(gravidadeOcorr.map(g => ({
        label: g, value: ocorr.filter(o => o.gravidade === g).length,
        color: g === 'Grave' ? 'bg-red-500' : g === 'Média' ? 'bg-yellow-500' : 'bg-blue-400',
      })));

      const statusChecks = ['Aprovado', 'Recusado', 'Pendente', 'Avaria Grave'];
      setChecklistsPorStatus(statusChecks.map(s => ({
        label: s, value: checks.filter(c => c.status === s).length,
        color: s === 'Aprovado' ? 'bg-green-400' : s === 'Recusado' ? 'bg-red-400' : s === 'Avaria Grave' ? 'bg-red-600' : 'bg-yellow-400',
      })));

      const statusVeics = ['Disponível', 'Em Rota', 'Em Manutenção', 'Sinistrado'];
      setVeiculosPorStatus(statusVeics.map(s => ({
        label: s, value: veiculos.filter(v => v.status === s).length,
        color: s === 'Disponível' ? 'bg-green-400' : s === 'Em Rota' ? 'bg-brand-primary' : s === 'Em Manutenção' ? 'bg-yellow-400' : 'bg-red-400',
      })));

      setLoading(false);
    }
    load();
  }, [periodo]);

  async function exportarCSV() {
    const supabase = createClient();
    const desde = new Date();
    desde.setDate(desde.getDate() - parseInt(periodo));

    const [ocorrRes, checkRes] = await Promise.all([
      supabase.from('ocorrencias').select('codigo,motorista_nome,placa,status,gravidade,created_at').gte('created_at', desde.toISOString()),
      supabase.from('checklists').select('codigo,motorista_nome,placa,status,created_at').gte('created_at', desde.toISOString()),
    ]);

    const ocorrLinhas = (ocorrRes.data ?? []).map(r =>
      `${r.codigo},${r.motorista_nome},${r.placa},${r.status},${r.gravidade},${new Date(r.created_at).toLocaleDateString('pt-BR')}`
    );
    const checkLinhas = (checkRes.data ?? []).map(r =>
      `${r.codigo},${r.motorista_nome},${r.placa},${r.status},${new Date(r.created_at).toLocaleDateString('pt-BR')}`
    );

    const csv = [
      '=== OCORRÊNCIAS ===',
      'Código,Motorista,Placa,Status,Gravidade,Data',
      ...ocorrLinhas,
      '',
      '=== CHECKLISTS ===',
      'Código,Motorista,Placa,Status,Data',
      ...checkLinhas,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleetflow-relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const maxOcorr  = Math.max(...ocorrenciasPorStatus.map(i => i.value), 1);
  const maxChecks = Math.max(...checklistsPorStatus.map(i => i.value), 1);
  const maxVeics  = Math.max(...veiculosPorStatus.map(i => i.value), 1);
  const maxGrav   = Math.max(...ocorrenciasPorTipo.map(i => i.value), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-brand-primary" /> Relatórios & BI
          </h1>
          <p className="text-gray-500 text-sm mt-1">KPIs operacionais e exportação de dados</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={periodo} onChange={e => setPeriodo(e.target.value)}>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          <button onClick={exportarCSV}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                {kpi.sub && <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Gráficos 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ocorrências por Status</h3>
          <BarChart data={ocorrenciasPorStatus} max={maxOcorr} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ocorrências por Gravidade</h3>
          <BarChart data={ocorrenciasPorTipo} max={maxGrav} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Checklists por Status</h3>
          <BarChart data={checklistsPorStatus} max={maxChecks} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Frota por Status</h3>
          <BarChart data={veiculosPorStatus} max={maxVeics} />
        </div>
      </div>
    </div>
  );
}
