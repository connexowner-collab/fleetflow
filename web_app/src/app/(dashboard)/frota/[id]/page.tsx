"use client";

import { useState, useEffect, use } from 'react';
import { 
  Truck, Calendar, MapPin, Activity, FileText, ClipboardList, 
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, 
  ExternalLink, User, Fuel, Gauge, Hash, Box, Plus, X, Edit2, Trash2, Clock, AlertTriangle, Paperclip, ChevronDown, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Tab = 'geral' | 'documentos' | 'checklists';

type Vehicle = {
  id: string;
  placa: string;
  modelo: string;
  marca: string | null;
  tipo: string | null;
  capacidade: string | null;
  combustivel: string | null;
  cor: string | null;
  renavam: string | null;
  chassi: string | null;
  filial: string | null;
  ano_fabricacao: number | null;
  ano_modelo: number | null;
  km_atual: number | null;
  status: string;
  profiles?: { nome?: string } | null;
};

type Documento = {
  id: string;
  veiculo_id: string;
  tipo: string;
  data_vencimento: string | null;
  url_anexo: string | null;
  observacao: string | null;
  status?: 'ok' | 'vence_em_breve' | 'vencido' | 'sem_data';
};

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

type Checklist = {
  id: string;
  codigo: string;
  motorista_nome: string;
  status: string;
  created_at: string;
  km_atual: number | null;
};

export default function VehicleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('geral');
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para CRUD de Documentos
  const [showDocForm, setShowDocForm] = useState(false);
  const [editandoDoc, setEditandoDoc] = useState<Documento | null>(null);
  const [salvandoDoc, setSalvandoDoc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ veiculo_id: id, tipo: 'CRLV', data_vencimento: '', observacao: '', url_anexo: '' });

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`/api/admin/frota/documentos?veiculo_id=${id}`);
      const data = await res.json();
      const enriched = (data.documentos ?? []).map((d: Documento) => ({
        ...d,
        status: getStatus(d.data_vencimento)
      }));
      setDocuments(enriched);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Busca veículo
        const resV = await fetch(`/api/admin/frota?id=${id}`);
        const dataV = await resV.json();
        if (dataV.veiculos && dataV.veiculos.length > 0) {
          setVehicle(dataV.veiculos[0]);
        } else {
          setError('Veículo não encontrado');
        }

        await fetchDocuments();

        // Busca checklists
        const resC = await fetch(`/api/admin/frota/checklists?veiculo_id=${id}`);
        const dataC = await resC.json();
        setChecklists(dataC.checklists ?? []);

      } catch (err) {
        console.error(err);
        setError('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Funções CRUD Documentos
  function abrirFormDoc(doc?: Documento) {
    if (doc) {
      setEditandoDoc(doc);
      setDocForm({
        veiculo_id: id,
        tipo: doc.tipo,
        data_vencimento: doc.data_vencimento ?? '',
        observacao: doc.observacao ?? '',
        url_anexo: doc.url_anexo ?? ''
      });
    } else {
      setEditandoDoc(null);
      setDocForm({ veiculo_id: id, tipo: 'CRLV', data_vencimento: '', observacao: '', url_anexo: '' });
    }
    setShowDocForm(true);
  }

  async function handleDocFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `docs/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('fleetflow-docs').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('fleetflow-docs').getPublicUrl(filePath);
      setDocForm(f => ({ ...f, url_anexo: publicUrl }));
    } catch (err) { console.error(err); alert('Erro ao subir arquivo.'); }
    finally { setUploadingDoc(false); }
  }

  async function salvarDoc() {
    setSalvandoDoc(true);
    try {
      const res = await fetch('/api/admin/frota/documentos', {
        method: editandoDoc ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editandoDoc
          ? { id: editandoDoc.id, data_vencimento: docForm.data_vencimento, observacao: docForm.observacao, url_anexo: docForm.url_anexo }
          : docForm),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowDocForm(false); 
      fetchDocuments();
    } catch (err) { console.error(err); alert('Erro ao salvar documento.'); }
    finally { setSalvandoDoc(false); }
  }

  async function excluirDoc(docId: string) {
    if (!confirm('Excluir este documento?')) return;
    try {
      const supabase = createClient();
      await supabase.from('veiculo_documentos').delete().eq('id', docId);
      fetchDocuments();
    } catch (err) { console.error(err); }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-primary" />
        <p className="font-medium">Carregando detalhes do veículo...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 p-6">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h2>
        <p className="text-center max-w-xs mb-6">{error || 'Não foi possível carregar as informações deste veículo.'}</p>
        <button 
          onClick={() => router.back()}
          className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all"
        >
          Voltar
        </button>
      </div>
    );
  }

  const tabCls = (t: Tab) => `
    flex-1 py-4 text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2
    ${activeTab === t 
      ? 'border-brand-primary text-brand-primary bg-brand-primary/5' 
      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
  `;

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900">{vehicle.placa}</h1>
              <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${
                vehicle.status === 'Ativo' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {vehicle.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500">{vehicle.marca} {vehicle.modelo} · {vehicle.ano_modelo || '—'}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motorista Atual</p>
            <p className="text-sm font-bold text-gray-900">{vehicle.profiles?.nome || 'Não vinculado'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setActiveTab('geral')} className={tabCls('geral')}>
            <Truck className="w-4 h-4" /> Dados Gerais
          </button>
          <button onClick={() => setActiveTab('documentos')} className={tabCls('documentos')}>
            <FileText className="w-4 h-4" /> Documentos
          </button>
          <button onClick={() => setActiveTab('checklists')} className={tabCls('checklists')}>
            <ClipboardList className="w-4 h-4" /> Checklists
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'geral' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Box className="w-3 h-3" /> Especificações
                </h3>
                <div className="space-y-3">
                  <InfoItem label="Marca / Modelo" value={`${vehicle.marca || ''} ${vehicle.modelo || ''}`} icon={Truck} />
                  <InfoItem label="Ano (Fab/Mod)" value={`${vehicle.ano_fabricacao || '—'} / ${vehicle.ano_modelo || '—'}`} icon={Calendar} />
                  <InfoItem label="Combustível" value={vehicle.combustivel || '—'} icon={Fuel} />
                  <InfoItem label="Tipo / Categoria" value={vehicle.tipo || '—'} icon={Truck} />
                  <InfoItem label="Capacidade" value={vehicle.capacidade || '—'} icon={Activity} />
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-3 h-3" /> Identificação e Local
                </h3>
                <div className="space-y-3">
                  <InfoItem label="Filial / Unidade" value={vehicle.filial || '—'} icon={MapPin} />
                  <InfoItem label="RENAVAM" value={vehicle.renavam || '—'} icon={Hash} />
                  <InfoItem label="Chassi" value={vehicle.chassi || '—'} icon={Hash} />
                  <InfoItem label="Km Atual" value={vehicle.km_atual ? `${vehicle.km_atual.toLocaleString()} km` : '—'} icon={Gauge} />
                  <InfoItem label="ID Rastreador" value={vehicle.device_id || '—'} icon={Activity} />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'documentos' && (
            <div className="space-y-4">
              {/* KPIs de Documentos */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-red-600">
                    {documents.filter(d => d.status === 'vencido').length}
                  </p>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">Vencidos</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-amber-600">
                    {documents.filter(d => d.status === 'vence_em_breve').length}
                  </p>
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-tight">Vencem 30d</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-emerald-600">
                    {documents.filter(d => d.status === 'ok').length}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Válidos</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => abrirFormDoc()}
                  className="flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-brand-primary/10 hover:bg-brand-primary/90 transition-all active:scale-95">
                  <Plus className="w-4 h-4" /> Novo Documento
                </button>
              </div>

              {documents.length === 0 ? (
                <EmptyState icon={FileText} message="Nenhum documento encontrado." />
              ) : (
                <div className="grid gap-3">
                  {documents.map(doc => {
                    const st = doc.status ?? 'sem_data';
                    const sc = STATUS_CONFIG[st as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.sem_data;
                    const Icon = sc.icon;
                    return (
                      <div key={doc.id} className={`bg-white rounded-2xl border flex items-stretch overflow-hidden ${sc.border}`}>
                        <div className={`w-1 shrink-0 ${sc.bar}`} />
                        <div className="flex-1 px-4 py-3.5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-black text-gray-900">{doc.tipo}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                {doc.data_vencimento && (
                                  <span>Vence: {new Date(doc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                                )}
                                {doc.url_anexo && (
                                  <a href={doc.url_anexo} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-brand-primary font-bold hover:underline">
                                    <Paperclip className="w-3 h-3" /> VER ANEXO
                                  </a>
                                )}
                              </div>
                              {doc.observacao && (
                                <p className="text-xs text-gray-400 mt-1 truncate">{doc.observacao}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>
                                <Icon className="w-3 h-3" />{sc.label}
                              </span>
                              <div className="flex gap-1">
                                <button onClick={() => abrirFormDoc(doc)}
                                  className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => excluirDoc(doc.id)}
                                  className="p-1.5 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
          )}

          {activeTab === 'checklists' && (
            <div className="space-y-4">
              {checklists.length === 0 ? (
                <EmptyState icon={ClipboardList} message="Nenhum checklist realizado para este veículo." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-50">
                        <th className="py-3 px-2">Data</th>
                        <th className="py-3 px-2">Código</th>
                        <th className="py-3 px-2">Motorista</th>
                        <th className="py-3 px-2">KM</th>
                        <th className="py-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {checklists.map(ck => (
                        <tr key={ck.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-2 font-medium text-gray-600">
                            {new Date(ck.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-3 px-2 font-mono text-xs text-gray-500">{ck.codigo}</td>
                          <td className="py-3 px-2 text-gray-700">{ck.motorista_nome}</td>
                          <td className="py-3 px-2 text-gray-500">{ck.km_atual?.toLocaleString() || '—'}</td>
                          <td className="py-3 px-2 text-right">
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                              ck.status === 'Aprovado' ? 'bg-green-100 text-green-700' : 
                              ck.status === 'Recusado' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {ck.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Documento */}
      {showDocForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDocForm(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-primary" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{editandoDoc ? 'Editar Documento' : 'Novo Documento'}</h2>
              </div>
              <button onClick={() => setShowDocForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <div className="relative">
                    <select className={inputCls + ' appearance-none pr-8'}
                      value={docForm.tipo} onChange={e => setDocForm(f => ({ ...f, tipo: e.target.value }))}>
                      {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Anexo (Foto/PDF)</label>
                  <label className={`flex items-center justify-center gap-2 ${inputCls} cursor-pointer hover:bg-gray-100 transition-colors`}>
                    <input type="file" className="hidden" onChange={handleDocFileUpload} accept="image/*,application/pdf" />
                    {uploadingDoc ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : docForm.url_anexo ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-emerald-600 font-bold">Pronto</span>
                      </>
                    ) : (
                      <>
                        <Paperclip className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-400">Subir</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data de Vencimento</label>
                <input type="date" className={inputCls} value={docForm.data_vencimento}
                  onChange={e => setDocForm(f => ({ ...f, data_vencimento: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Observação</label>
                <textarea rows={2} className={inputCls + ' resize-none'} value={docForm.observacao}
                  onChange={e => setDocForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowDocForm(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={salvarDoc} disabled={salvandoDoc || uploadingDoc}
                className="flex-1 py-3 rounded-2xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-brand-primary/20">
                {salvandoDoc ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-all shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Icon className="w-12 h-12 opacity-10 mb-3" />
      <p className="text-sm italic">{message}</p>
    </div>
  );
}
