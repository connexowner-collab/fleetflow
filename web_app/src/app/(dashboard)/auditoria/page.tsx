"use client";

import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';

interface AuditLog {
  id: string;
  created_at: string;
  ator_email: string;
  ator_perfil: string;
  acao: string;
  usuario_afetado_email: string | null;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  ip: string | null;
  ambiente: string;
  tenant_id: string | null;
}

const ACAO_COLOR: Record<string, string> = {
  USER_CREATED: 'bg-green-100 text-green-700',
  USER_EDITED: 'bg-blue-100 text-blue-700',
  USER_DELETED: 'bg-red-100 text-red-700',
  USER_ACTIVATED: 'bg-green-100 text-green-700',
  USER_DEACTIVATED: 'bg-yellow-100 text-yellow-700',
  PASSWORD_RESET: 'bg-purple-100 text-purple-700',
  VEHICLE_CREATED: 'bg-green-100 text-green-700',
  VEHICLE_EDITED: 'bg-blue-100 text-blue-700',
  VEHICLE_DELETED: 'bg-red-100 text-red-700',
  VEHICLE_LINKED: 'bg-indigo-100 text-indigo-700',
  VEHICLE_UNLINKED: 'bg-orange-100 text-orange-700',
  MANUTENCAO_CRIADA: 'bg-green-100 text-green-700',
  MANUTENCAO_INICIADA: 'bg-blue-100 text-blue-700',
  MANUTENCAO_CONCLUIDA: 'bg-green-100 text-green-700',
  MANUTENCAO_CANCELADA: 'bg-gray-100 text-gray-700',
  MANUTENCAO_RECUSADA: 'bg-red-100 text-red-700',
  MANUTENCAO_REPROVADA: 'bg-orange-100 text-orange-700',
  CHECKLIST_CREATED: 'bg-green-100 text-green-700',
  CHECKLIST_VALIDATED: 'bg-blue-100 text-blue-700',
  CHECKLIST_PDF_GERADO: 'bg-purple-100 text-purple-700',
  FILIAL_CRIADA: 'bg-green-100 text-green-700',
  FILIAL_EDITADA: 'bg-blue-100 text-blue-700',
  CONFIG_ALTERADA: 'bg-yellow-100 text-yellow-700',
  LOGIN: 'bg-gray-100 text-gray-700',
  LOGOUT: 'bg-gray-100 text-gray-700',
};

const ACAO_LABEL: Record<string, string> = {
  USER_CREATED: 'Usuário Criado',
  USER_EDITED: 'Usuário Editado',
  USER_DELETED: 'Usuário Excluído',
  USER_ACTIVATED: 'Usuário Ativado',
  USER_DEACTIVATED: 'Usuário Inativado',
  PASSWORD_RESET: 'Senha Redefinida',
  VEHICLE_CREATED: 'Veículo Criado',
  VEHICLE_EDITED: 'Veículo Editado',
  VEHICLE_DELETED: 'Veículo Excluído',
  VEHICLE_LINKED: 'Vínculo de Veículo',
  VEHICLE_UNLINKED: 'Desvinculação',
  MANUTENCAO_CRIADA: 'Manutenção Criada',
  MANUTENCAO_INICIADA: 'Manutenção Iniciada',
  MANUTENCAO_CONCLUIDA: 'Manutenção Concluída',
  MANUTENCAO_CANCELADA: 'Manutenção Cancelada',
  MANUTENCAO_RECUSADA: 'Manutenção Recusada',
  MANUTENCAO_REPROVADA: 'Manutenção Reprovada',
  MANUTENCAO_EM_ANDAMENTO: 'Em Manutenção',
  CHECKLIST_CREATED: 'Checklist Criado',
  CHECKLIST_VALIDATED: 'Checklist Validado',
  CHECKLIST_PDF_GERADO: 'PDF Gerado',
  FILIAL_CRIADA: 'Filial Criada',
  FILIAL_EDITADA: 'Filial Editada',
  FILIAL_DESATIVADA: 'Filial Desativada',
  CONFIG_ALTERADA: 'Configuração Alterada',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

export default function AuditoriaPage() {
  const [logs, setLogs]         = useState<AuditLog[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [filtroAtor, setFiltroAtor]   = useState('');
  const [filtroAcao, setFiltroAcao]   = useState('');
  const [dataIni, setDataIni]   = useState('');
  const [dataFim, setDataFim]   = useState('');
  const [detalhe, setDetalhe]   = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (filtroAtor) params.set('ator_email', filtroAtor);
    if (filtroAcao) params.set('acao', filtroAcao);
    if (dataIni) params.set('data_ini', dataIni);
    if (dataFim) params.set('data_fim', dataFim);

    const res  = await fetch(`/api/admin/audit-log?${params}`);
    const json = await res.json();
    setLogs(json.logs ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, filtroAtor, filtroAcao, dataIni, dataFim]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);

  function fmtDT(d: string) {
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  const ACOES_DISPONIVEIS = Object.keys(ACAO_LABEL).sort();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-7 h-7 text-brand-primary" /> Log de Auditoria
        </h1>
        <p className="text-gray-500 text-sm mt-1">Histórico imutável de todas as ações do sistema</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="E-mail do ator..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              value={filtroAtor}
              onChange={e => { setFiltroAtor(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={filtroAcao}
            onChange={e => { setFiltroAcao(e.target.value); setPage(1); }}
          >
            <option value="">Todas as ações</option>
            {ACOES_DISPONIVEIS.map(a => (
              <option key={a} value={a}>{ACAO_LABEL[a] ?? a}</option>
            ))}
          </select>
          <input type="date" placeholder="Data início" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={dataIni} onChange={e => { setDataIni(e.target.value); setPage(1); }} />
          <input type="date" placeholder="Data fim" className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            value={dataFim} onChange={e => { setDataFim(e.target.value); setPage(1); }} />
        </div>
        {(filtroAtor || filtroAcao || dataIni || dataFim) && (
          <button
            onClick={() => { setFiltroAtor(''); setFiltroAcao(''); setDataIni(''); setDataFim(''); setPage(1); }}
            className="mt-2 text-xs text-brand-primary hover:underline"
          >Limpar filtros</button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-500">{total.toLocaleString('pt-BR')} eventos encontrados</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum evento encontrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Data/Hora','Ação','Ator','Afetado','Ambiente',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{fmtDT(log.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACAO_COLOR[log.acao] ?? 'bg-gray-100 text-gray-700'}`}>
                      {ACAO_LABEL[log.acao] ?? log.acao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="block text-xs font-medium">{log.ator_email}</span>
                    <span className="text-xs text-gray-400 capitalize">{log.ator_perfil}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{log.usuario_afetado_email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{log.ambiente}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(log.dados_antes || log.dados_depois) && (
                      <button
                        onClick={() => setDetalhe(log)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                        title="Ver detalhes"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Detalhes do Evento</h3>
              <button onClick={() => setDetalhe(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-400 uppercase">Ação</p><p className="font-medium mt-0.5">{ACAO_LABEL[detalhe.acao] ?? detalhe.acao}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Data/Hora</p><p className="font-medium mt-0.5">{fmtDT(detalhe.created_at)}</p></div>
                <div><p className="text-xs text-gray-400 uppercase">Ator</p><p className="font-medium mt-0.5">{detalhe.ator_email} ({detalhe.ator_perfil})</p></div>
                <div><p className="text-xs text-gray-400 uppercase">IP</p><p className="font-medium mt-0.5">{detalhe.ip || '—'}</p></div>
              </div>
              {detalhe.dados_antes && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">Dados Antes</p>
                  <pre className="bg-red-50 rounded-lg p-3 text-xs text-red-700 overflow-x-auto">
                    {JSON.stringify(detalhe.dados_antes, null, 2)}
                  </pre>
                </div>
              )}
              {detalhe.dados_depois && (
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">Dados Depois</p>
                  <pre className="bg-green-50 rounded-lg p-3 text-xs text-green-700 overflow-x-auto">
                    {JSON.stringify(detalhe.dados_depois, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
