"use client";

import { useState, useEffect } from 'react';
import {
  Search, AlertTriangle, CheckCircle2, Clock, Car, User, Camera,
  ClipboardCheck, X, FileSignature, AlertOctagon, ChevronRight,
} from 'lucide-react';

type ChecklistItem = { nome: string; conforme: boolean };
type ChecklistFoto = { tipo: string; url: string };

type ValidarModal = { inspection: Inspection; obs: string; submitting: boolean } | null;

type Inspection = {
  id: string; id_real: string; motorista: string; placa: string;
  data: string; status: string; km: string; tem_avaria: boolean;
};

const STATUS_CFG: Record<string, { pill: string; bar: string; icon: React.ElementType }> = {
  'Aprovado':       { pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', icon: CheckCircle2  },
  'Validado':       { pill: 'bg-green-100 text-green-700',     bar: 'bg-green-500',   icon: CheckCircle2  },
  'Com Pendências': { pill: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-400',   icon: AlertTriangle },
  'Pendente':       { pill: 'bg-blue-100 text-blue-700',       bar: 'bg-blue-400',    icon: Clock         },
  'Avaria Grave':   { pill: 'bg-red-100 text-red-700',         bar: 'bg-red-600',     icon: AlertOctagon  },
  'Recusado':       { pill: 'bg-red-100 text-red-700',         bar: 'bg-red-500',     icon: AlertOctagon  },
};
const DEFAULT_STATUS = { pill: 'bg-gray-100 text-gray-600', bar: 'bg-gray-300', icon: Clock };

const FILTERS = ['Todos', 'Pendente', 'Aprovado', 'Validado', 'Com Pendências', 'Avaria Grave', 'Recusado'];

export default function ChecklistsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [selectedItens, setSelectedItens] = useState<ChecklistItem[]>([]);
  const [selectedFotos, setSelectedFotos] = useState<ChecklistFoto[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const [validarModal, setValidarModal] = useState<ValidarModal>(null);

  const fetchInspections = async () => {
    try {
      const res = await fetch('/api/admin/checklists?limit=100');
      if (!res.ok) throw new Error('Erro ao buscar checklists');
      const json = await res.json();
      setInspections((json.checklists || []).map((c: {
        id: string; codigo?: string; motorista_nome?: string; placa?: string;
        km_atual?: number; status?: string; tem_avaria?: boolean; created_at: string;
      }) => ({
        id: c.codigo || c.id, id_real: c.id,
        motorista: c.motorista_nome || '', placa: c.placa || '',
        data: new Date(c.created_at).toLocaleDateString('pt-BR') + ', ' +
              new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: c.status || 'Pendente',
        km: c.km_atual?.toLocaleString('pt-BR') ?? '0',
        tem_avaria: c.tem_avaria ?? false,
      })));
    } catch { setInspections([]); }
  };

  useEffect(() => { fetchInspections(); }, []);

  const handleSelectInspection = async (insp: Inspection) => {
    setSelectedInspection(insp);
    setSelectedItens([]); setSelectedFotos([]);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/checklists/${insp.id_real}`);
      if (!res.ok) throw new Error('Erro ao buscar detalhes');
      const json = await res.json();
      setSelectedItens(json.itens ?? []);
      setSelectedFotos(json.fotos ?? []);
    } catch { /* drawer still shows */ }
    finally { setLoadingDetail(false); }
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  async function patchChecklist(id: string, status: string, obs?: string) {
    const res = await fetch('/api/admin/checklists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, observacao_validacao: obs }),
    });
    if (!res.ok) throw new Error('Erro ao atualizar checklist');
    return res.json();
  }

  const handleValidar = (inspection: Inspection) => {
    setValidarModal({ inspection, obs: '', submitting: false });
  };

  const submitValidar = async () => {
    if (!validarModal) return;
    const { inspection, obs } = validarModal;
    if (!obs.trim()) return;
    setValidarModal(m => m ? { ...m, submitting: true } : null);
    try {
      await patchChecklist(inspection.id_real, 'Validado', obs.trim());
      setInspections(prev => prev.map(i => i.id_real === inspection.id_real ? { ...i, status: 'Validado' } : i));
      setSelectedInspection(null);
      setValidarModal(null);
      showToast(`✅ Checklist ${inspection.id} validado!`);
    } catch {
      setValidarModal(m => m ? { ...m, submitting: false } : null);
      showToast('⚠️ Erro ao validar.');
    }
  };

  const handleAprovar = async (inspection: Inspection) => {
    try {
      await patchChecklist(inspection.id_real, 'Aprovado');
      setInspections(prev => prev.map(i => i.id_real === inspection.id_real ? { ...i, status: 'Aprovado' } : i));
      setSelectedInspection(null);
      showToast(`✅ Checklist ${inspection.id} aprovado!`);
    } catch { showToast('⚠️ Erro ao aprovar.'); }
  };

  const handleRecusar = async (inspection: Inspection) => {
    try {
      await patchChecklist(inspection.id_real, 'Recusado');
      setInspections(prev => prev.map(i => i.id_real === inspection.id_real ? { ...i, status: 'Recusado' } : i));
      setSelectedInspection(null);
      showToast(`Checklist ${inspection.id} recusado.`);
    } catch { showToast('⚠️ Erro ao recusar.'); }
  };

  const filtered = inspections.filter(insp => {
    const q = search.toLowerCase();
    const matchSearch = !search || insp.placa.toLowerCase().includes(q) ||
      insp.motorista.toLowerCase().includes(q) || insp.id.toLowerCase().includes(q);
    const matchStatus = filter === 'Todos' || insp.status === filter;
    return matchSearch && matchStatus;
  });

  const pendentes = inspections.filter(i => i.status === 'Pendente').length;
  const avarias   = inspections.filter(i => i.tem_avaria && i.status !== 'Aprovado').length;
  const aprovados = inspections.filter(i => i.status === 'Aprovado' || i.status === 'Validado').length;

  const conformes    = selectedItens.filter(i => i.conforme).length;
  const naoConformes = selectedItens.filter(i => !i.conforme).length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      {/* Modal — Validar com observação (CA-28) */}
      {validarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !validarModal.submitting && setValidarModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-black text-gray-900">Validar Checklist</h3>
              <p className="text-sm text-gray-500 mt-0.5">{validarModal.inspection.id} — {validarModal.inspection.placa}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Observação de Validação <span className="text-red-500">*</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                placeholder="Descreva as observações para validar e liberar este checklist..."
                value={validarModal.obs}
                onChange={e => setValidarModal(m => m ? { ...m, obs: e.target.value } : null)}
                className="mt-1.5 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setValidarModal(null)}
                disabled={validarModal.submitting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={submitValidar}
                disabled={!validarModal.obs.trim() || validarModal.submitting}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {validarModal.submitting ? 'Validando...' : 'Validar e Liberar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet overlay */}
      {selectedInspection && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setSelectedInspection(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
            <PanelContent
              insp={selectedInspection} itens={selectedItens} fotos={selectedFotos}
              loadingDetail={loadingDetail} conformes={conformes} naoConformes={naoConformes}
              onClose={() => setSelectedInspection(null)}
              onValidar={handleValidar} onAprovar={handleAprovar} onRecusar={handleRecusar}
            />
          </div>
        </>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Checklists</h1>
        <p className="text-sm text-gray-400 mt-0.5">Inspeções diárias enviadas pelo app do motorista</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-blue-600">{pendentes}</p>
          <p className="text-xs text-blue-500 font-semibold mt-0.5">Pendentes</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{avarias}</p>
          <p className="text-xs text-red-500 font-semibold mt-0.5">Com Avaria</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{aprovados}</p>
          <p className="text-xs text-emerald-500 font-semibold mt-0.5">Aprovados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar placa, motorista, código..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
              filter === f ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Split layout */}
      <div className="flex gap-5">
        {/* List */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <ClipboardCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhum checklist encontrado</p>
            </div>
          ) : filtered.map(insp => {
            const sc = STATUS_CFG[insp.status] ?? DEFAULT_STATUS;
            const StatusIcon = sc.icon;
            const isSelected = selectedInspection?.id_real === insp.id_real;
            return (
              <button key={insp.id_real} onClick={() => { if (isSelected) setSelectedInspection(null); else handleSelectInspection(insp); }}
                className={`w-full text-left bg-white rounded-2xl border transition-all flex items-stretch overflow-hidden hover:shadow-md active:scale-[.99] ${
                  isSelected ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-md' : 'border-gray-100'
                }`}>
                {/* Status bar */}
                <div className={`w-1 shrink-0 ${sc.bar}`} />
                <div className="flex-1 px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-gray-400 font-mono">{insp.id}</span>
                      {insp.tem_avaria && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Avaria</span>
                      )}
                    </div>
                    <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {insp.placa}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" />{insp.motorista}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.pill}`}>
                      <StatusIcon className="w-3 h-3" />{insp.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{insp.data}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop side panel */}
        <div className="hidden md:block w-80 shrink-0">
          {selectedInspection ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
              <PanelContent
                insp={selectedInspection} itens={selectedItens} fotos={selectedFotos}
                loadingDetail={loadingDetail} conformes={conformes} naoConformes={naoConformes}
                onClose={() => setSelectedInspection(null)}
                onValidar={handleValidar} onAprovar={handleAprovar} onRecusar={handleRecusar}
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center sticky top-24">
              <ClipboardCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-medium">Selecione um checklist<br/>para auditar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detail Panel ─────────────────────────────────────────── */
function PanelContent({ insp, itens, fotos, loadingDetail, conformes, naoConformes, onClose, onValidar, onAprovar, onRecusar }: {
  insp: Inspection; itens: ChecklistItem[]; fotos: ChecklistFoto[];
  loadingDetail: boolean; conformes: number; naoConformes: number;
  onClose: () => void;
  onValidar: (i: Inspection) => void; onAprovar: (i: Inspection) => void; onRecusar: (i: Inspection) => void;
}) {
  const sc = STATUS_CFG[insp.status] ?? DEFAULT_STATUS;
  const StatusIcon = sc.icon;
  return (
    <div className="flex flex-col max-h-[88vh] md:max-h-none">
      {/* Handle (mobile) */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />

      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-gray-400 font-mono">{insp.id}</span>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.pill}`}>
              <StatusIcon className="w-3 h-3" />{insp.status}
            </span>
          </div>
          <p className="font-bold text-gray-900">{insp.placa}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: User, label: 'Motorista', value: insp.motorista },
            { icon: Car,  label: 'Odômetro',  value: `${insp.km} km` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{label}</p>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />{value || '—'}
              </p>
            </div>
          ))}
        </div>

        {/* Avaria badge */}
        {insp.tem_avaria && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs font-bold text-red-700">Avaria reportada neste checklist</p>
          </div>
        )}

        {/* Itens de inspeção */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Itens de Inspeção</p>
            {!loadingDetail && itens.length > 0 && (
              <span className="text-[10px] text-gray-400 font-bold">{conformes} OK · {naoConformes} ⚠</span>
            )}
          </div>
          {loadingDetail ? (
            <div className="p-4 space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-7 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : itens.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Nenhum item registrado.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {itens.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-gray-700">{item.nome}</span>
                  {item.conforme ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Avaria</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fotos */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />Evidências
          </p>
          {loadingDetail ? (
            <div className="grid grid-cols-2 gap-2">
              {[1,2].map(i => <div key={i} className="aspect-video bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : fotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {fotos.map((foto, idx) => (
                <a key={idx} href={foto.url} target="_blank" rel="noopener noreferrer"
                  className="aspect-video rounded-xl overflow-hidden border border-gray-100 relative group">
                  <img src={foto.url} alt={foto.tipo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1">
                    <p className="text-white text-[9px] font-bold uppercase text-center">{foto.tipo}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {['Dianteira','Traseira'].map(l => (
                <div key={l} className="aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <Camera className="w-5 h-5 text-gray-200 mb-1" />
                  <span className="text-[10px] text-gray-300 font-bold uppercase">{l}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assinatura */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
          <FileSignature className="w-5 h-5 text-gray-300 mx-auto mb-2" />
          <p className="font-serif italic font-black text-gray-700 underline decoration-brand-primary/40 decoration-2 underline-offset-4">
            {insp.motorista}
          </p>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-2">Assinatura Digital</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 p-4 space-y-2 bg-white shrink-0">
        <div className="flex gap-2">
          <button onClick={() => onRecusar(insp)}
            disabled={!['Com Pendências', 'Pendente'].includes(insp.status)}
            className="flex-1 py-3 rounded-2xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Recusar
          </button>
          <button onClick={() => onAprovar(insp)}
            disabled={!['Com Pendências', 'Pendente'].includes(insp.status)}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Aprovar
          </button>
        </div>
        <button onClick={() => onValidar(insp)}
          disabled={insp.status !== 'Com Pendências'}
          className="w-full py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20">
          <CheckCircle2 className="w-4 h-4" />Validar e Liberar
        </button>
      </div>
    </div>
  );
}
