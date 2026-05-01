"use client";

import React, { useState, useEffect, use, useMemo, useCallback } from 'react';
import { 
  Truck, Calendar, MapPin, Activity, FileText, ClipboardList, 
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, 
  ExternalLink, User, Fuel, Gauge, Hash, Box, Plus, X, Edit2, Trash2, Clock, AlertTriangle, Paperclip, ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// ── Tipos ─────────────────────────────────────────────────

type Tab = 'geral' | 'documentos' | 'checklists';

type Vehicle = {
  id: string; placa: string; modelo: string; marca: string | null;
  tipo: string | null; capacidade: string | null; combustivel: string | null;
  cor: string | null; renavam: string | null; chassi: string | null;
  filial: string | null; ano_fabricacao: number | null; ano_modelo: number | null;
  km_atual: number | null; status: string; device_id?: string;
  profiles?: { nome?: string } | null;
};

type Documento = {
  id: string; veiculo_id: string; tipo: string;
  data_vencimento: string | null; url_anexo: string | null;
  observacao: string | null; status?: 'ok' | 'vence_em_breve' | 'vencido' | 'sem_data';
};

type Checklist = {
  id: string; codigo: string; motorista_nome: string;
  status: string; created_at: string; km_atual: number | null;
};

// ── Helpers & Constantes ──────────────────────────────────

function getStatus(data_vencimento: string | null): 'ok' | 'vence_em_breve' | 'vencido' | 'sem_data' {
  if (!data_vencimento) return 'sem_data';
  const hoje = new Date();
  const venc = new Date(data_vencimento + 'T12:00:00');
  const diff = Math.floor((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'vencido';
  if (diff <= 30) return 'vence_em_breve';
  return 'ok';
}

const STATUS_CONFIG = {
  ok:             { label: 'Válido',         color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100', bar: 'bg-emerald-500', icon: CheckCircle2  },
  vence_em_breve: { label: 'Vence em breve', color: 'bg-amber-100 text-amber-700',     border: 'border-amber-100',   bar: 'bg-amber-400',   icon: Clock        },
  vencido:        { label: 'Vencido',        color: 'bg-red-100 text-red-700',         border: 'border-red-100',     bar: 'bg-red-500',     icon: AlertTriangle },
  sem_data:       { label: 'Sem data',       color: 'bg-gray-100 text-gray-500',       border: 'border-gray-100',    bar: 'bg-gray-300',    icon: FileText     },
};

const TIPOS_DOC = ['CRLV', 'Seguro', 'Licença', 'Tacógrafo', 'ANTT', 'Outros'];
const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all';

// Simple Cache Session
const globalCache: Record<string, { vehicle: any, documents: any[], checklists: any[], timestamp: number }> = {};

// ── Componentes de Aba (Memoizados) ───────────────────────

const InfoItem = React.memo(({ label, value, icon: Icon }: { label: string; value: string; icon: any }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-all shadow-sm">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-black text-gray-800">{value}</p>
    </div>
  </div>
));
InfoItem.displayName = 'InfoItem';

const EmptyState = React.memo(({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
    <Icon className="w-12 h-12 opacity-10 mb-3" />
    <p className="text-sm italic">{message}</p>
  </div>
));
EmptyState.displayName = 'EmptyState';

// ── Página Principal ──────────────────────────────────────

export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [vehicle, setVehicle] = useState<Vehicle | null>(globalCache[id]?.vehicle || null);
  const [documents, setDocuments] = useState<Documento[]>(globalCache[id]?.documents || []);
  const [checklists, setChecklists] = useState<Checklist[]>(globalCache[id]?.checklists || []);
  const [loading, setLoading] = useState(!globalCache[id]);
  const [error, setError] = useState<string | null>(null);

  // Modal Doc State
  const [showDocForm, setShowDocForm] = useState(false);
  const [editandoDoc, setEditandoDoc] = useState<Documento | null>(null);
  const [salvandoDoc, setSalvandoDoc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ veiculo_id: id, tipo: 'CRLV', data_vencimento: '', observacao: '', url_anexo: '' });

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh && !globalCache[id]) setLoading(true);
    
    try {
      // Execução Paralela - Melhoria 1 (Promise.all)
      const [resV, resD, resC] = await Promise.all([
        fetch(`/api/admin/frota?id=${id}`),
        fetch(`/api/admin/frota/documentos?veiculo_id=${id}`),
        fetch(`/api/admin/frota/checklists?veiculo_id=${id}`)
      ]);

      const [dataV, dataD, dataC] = await Promise.all([
        resV.json(),
        resD.json(),
        resC.json()
      ]);

      if (dataV.veiculos && dataV.veiculos.length > 0) {
        const v = dataV.veiculos[0];
        const docs = (dataD.documentos ?? []).map((d: any) => ({ ...d, status: getStatus(d.data_vencimento) }));
        const cks = dataC.checklists ?? [];

        setVehicle(v);
        setDocuments(docs);
        setChecklists(cks);

        // Atualiza Cache - Melhoria 4
        globalCache[id] = { vehicle: v, documents: docs, checklists: cks, timestamp: Date.now() };
      } else {
        setError('Veículo não encontrado');
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD Docs
  const abrirFormDoc = (doc?: Documento) => {
    if (doc) {
      setEditandoDoc(doc);
      setDocForm({ veiculo_id: id, tipo: doc.tipo, data_vencimento: doc.data_vencimento ?? '', observacao: doc.observacao ?? '', url_anexo: doc.url_anexo ?? '' });
    } else {
      setEditandoDoc(null);
      setDocForm({ veiculo_id: id, tipo: 'CRLV', data_vencimento: '', observacao: '', url_anexo: '' });
    }
    setShowDocForm(true);
  };

  const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const supabase = createClient();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('fleetflow-docs').upload(`docs/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('fleetflow-docs').getPublicUrl(`docs/${fileName}`);
      setDocForm(f => ({ ...f, url_anexo: publicUrl }));
    } catch (err) { console.error(err); alert('Erro no upload.'); }
    finally { setUploadingDoc(false); }
  };

  const salvarDoc = async () => {
    setSalvandoDoc(true);
    try {
      const res = await fetch('/api/admin/frota/documentos', {
        method: editandoDoc ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editandoDoc ? { id: editandoDoc.id, ...docForm } : docForm),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setShowDocForm(false);
      fetchData(true); // Silently refresh
    } catch (err) { alert('Erro ao salvar.'); }
    finally { setSalvandoDoc(false); }
  };

  const excluirDoc = async (docId: string) => {
    if (!confirm('Excluir documento?')) return;
    try {
      await createClient().from('veiculo_documentos').delete().eq('id', docId);
      fetchData(true);
    } catch (err) { console.error(err); }
  };

  // KPIs Memoizados - Melhoria 2
  const docKPIs = useMemo(() => {
    return {
      vencidos: documents.filter(d => d.status === 'vencido').length,
      venceEmBreve: documents.filter(d => d.status === 'vence_em_breve').length,
      validos: documents.filter(d => d.status === 'ok').length,
    };
  }, [documents]);

  if (loading && !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-primary" />
        <p className="font-medium animate-pulse">Sincronizando dados do veículo...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Veículo não localizado</h2>
        <button onClick={() => router.back()} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold">Voltar</button>
      </div>
    );
  }

  const tabCls = (t: Tab) => `
    flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2
    ${activeTab === t ? 'border-brand-primary text-brand-primary bg-brand-primary/5' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
  `;

  return (
    <div className="max-w-4xl mx-auto pb-10 animate-in fade-in duration-500">
      {/* Header - Melhoria de Feedback de Carregamento */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900">{vehicle.placa}</h1>
              {loading && <Loader2 className="w-3 h-3 animate-spin text-brand-primary" />}
            </div>
            <p className="text-sm text-gray-500">{vehicle.marca} {vehicle.modelo} · {vehicle.ano_modelo || '—'}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Motorista Atual</p>
            <p className="text-sm font-bold text-gray-900">{vehicle.profiles?.nome || 'Livre'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-inner"><User className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setActiveTab('geral')} className={tabCls('geral')}><Truck className="w-4 h-4" /> Geral</button>
          <button onClick={() => setActiveTab('documentos')} className={tabCls('documentos')}><FileText className="w-4 h-4" /> Documentos</button>
          <button onClick={() => setActiveTab('checklists')} className={tabCls('checklists')}><ClipboardList className="w-4 h-4" /> Checklists</button>
        </div>

        <div className="p-6 relative">
          {/* Aba Geral - Persistente no DOM para Velocidade - Melhoria 3 */}
          <div className={activeTab === 'geral' ? 'block animate-in fade-in zoom-in-95 duration-200' : 'hidden'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Box className="w-3 h-3" /> Especificações</h3>
                <div className="space-y-3">
                  <InfoItem label="Marca / Modelo" value={`${vehicle.marca || ''} ${vehicle.modelo || ''}`} icon={Truck} />
                  <InfoItem label="Ano (Fab/Mod)" value={`${vehicle.ano_fabricacao || '—'} / ${vehicle.ano_modelo || '—'}`} icon={Calendar} />
                  <InfoItem label="Combustível" value={vehicle.combustivel || '—'} icon={Fuel} />
                  <InfoItem label="Capacidade" value={vehicle.capacidade || '—'} icon={Activity} />
                </div>
              </section>
              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> Identificação</h3>
                <div className="space-y-3">
                  <InfoItem label="Filial" value={vehicle.filial || '—'} icon={MapPin} />
                  <InfoItem label="RENAVAM" value={vehicle.renavam || '—'} icon={Hash} />
                  <InfoItem label="Km Atual" value={vehicle.km_atual ? `${vehicle.km_atual.toLocaleString()} km` : '—'} icon={Gauge} />
                  <InfoItem label="ID Rastreador" value={vehicle.device_id || '—'} icon={Activity} />
                </div>
              </section>
            </div>
          </div>

          {/* Aba Documentos - Persistente no DOM */}
          <div className={activeTab === 'documentos' ? 'block animate-in slide-in-from-right-4 duration-300' : 'hidden'}>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <KPICard label="Vencidos" value={docKPIs.vencidos} color="red" />
                <KPICard label="Vencem 30d" value={docKPIs.venceEmBreve} color="amber" />
                <KPICard label="Válidos" value={docKPIs.validos} color="emerald" />
              </div>
              <div className="flex justify-end">
                <button onClick={() => abrirFormDoc()} className="flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all"><Plus className="w-4 h-4" /> Novo Documento</button>
              </div>
              {documents.length === 0 ? <EmptyState icon={FileText} message="Sem documentos." /> : (
                <div className="grid gap-3">
                  {documents.map(doc => {
                    const sc = STATUS_CONFIG[doc.status || 'sem_data'] || STATUS_CONFIG.sem_data;
                    const Icon = sc.icon;
                    return (
                      <div key={doc.id} className={`bg-white rounded-2xl border flex items-stretch overflow-hidden group transition-all hover:shadow-md ${sc.border}`}>
                        <div className={`w-1.5 shrink-0 ${sc.bar}`} />
                        <div className="flex-1 px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-gray-900">{doc.tipo}</p>
                              <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                                {doc.data_vencimento && <span>Vence: {new Date(doc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                                {doc.url_anexo && <a href={doc.url_anexo} target="_blank" rel="noreferrer" className="text-brand-primary font-bold flex items-center gap-1 hover:underline"><Paperclip className="w-3 h-3" /> ANEXO</a>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${sc.color}`}><Icon className="w-3 h-3" />{sc.label.toUpperCase()}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => abrirFormDoc(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-600"><Edit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => excluirDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Aba Checklists - Persistente no DOM */}
          <div className={activeTab === 'checklists' ? 'block animate-in slide-in-from-right-4 duration-300' : 'hidden'}>
            {checklists.length === 0 ? <EmptyState icon={ClipboardList} message="Sem checklists." /> : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                    <tr><th className="py-3 px-4">Data</th><th className="py-3 px-2">Código</th><th className="py-3 px-2">Motorista</th><th className="py-3 px-4 text-right">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {checklists.map(ck => (
                      <tr key={ck.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-600">{new Date(ck.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="py-3 px-2 font-mono text-xs text-gray-500">{ck.codigo}</td>
                        <td className="py-3 px-2 text-gray-700">{ck.motorista_nome}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${ck.status === 'Aprovado' ? 'bg-green-100 text-green-700' : ck.status === 'Recusado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{ck.status.toUpperCase()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Documento - Melhorado com Skeletons/Feedback */}
      {showDocForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowDocForm(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary"><FileText className="w-5 h-5" /></div>
                <h2 className="text-lg font-black text-gray-900">{editandoDoc ? 'Editar' : 'Novo'} Documento</h2>
              </div>
              <button onClick={() => setShowDocForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo</label>
                  <div className="relative">
                    <select className={inputCls + ' pr-8 appearance-none'} value={docForm.tipo} onChange={e => setDocForm(f => ({ ...f, tipo: e.target.value }))}>{TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Anexo</label>
                  <label className={`flex items-center justify-center gap-2 ${inputCls} cursor-pointer hover:bg-gray-100 transition-colors`}>
                    <input type="file" className="hidden" onChange={handleDocFileUpload} accept="image/*,application/pdf" />
                    {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin text-brand-primary" /> : docForm.url_anexo ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Paperclip className="w-4 h-4 text-gray-400" />}
                    <span className="font-bold text-gray-500">{uploadingDoc ? '...' : docForm.url_anexo ? 'Pronto' : 'Subir'}</span>
                  </label>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vencimento</label>
                <input type="date" className={inputCls} value={docForm.data_vencimento} onChange={e => setDocForm(f => ({ ...f, data_vencimento: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Observação</label>
                <textarea rows={2} className={inputCls + ' resize-none'} value={docForm.observacao} onChange={e => setDocForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 p-6 bg-gray-50/50 border-t border-gray-100">
              <button onClick={() => setShowDocForm(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancelar</button>
              <button onClick={salvarDoc} disabled={salvandoDoc || uploadingDoc} className="flex-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold shadow-lg shadow-brand-primary/25 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all">{salvandoDoc ? 'Gravando...' : 'Salvar Alterações'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const KPICard = React.memo(({ label, value, color }: { label: string; value: number; color: 'red' | 'amber' | 'emerald' }) => {
  const cls = {
    red: "bg-red-50 border-red-100 text-red-600",
    amber: "bg-amber-50 border-amber-100 text-amber-600",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-600"
  }[color];
  return (
    <div className={`border rounded-2xl p-3 text-center transition-all hover:scale-105 ${cls}`}>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-tight opacity-70">{label}</p>
    </div>
  );
});
KPICard.displayName = 'KPICard';
