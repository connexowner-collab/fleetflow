"use client";

import { useState, useEffect, useCallback } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Plus, X, ChevronDown, Edit2, Trash2, Paperclip, ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Documento {
  id: string; veiculo_id: string; veiculo_placa?: string;
  tipo: string; numero: string | null; data_vencimento: string | null;
  observacao: string | null; url_anexo?: string | null;
  status?: 'ok' | 'vence_em_breve' | 'vencido' | 'sem_data';
}

interface Veiculo { id: string; placa: string; modelo: string }

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
  ok:             { label: 'Válido',         color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100', bar: 'bg-emerald-500', icon: CheckCircle  },
  vence_em_breve: { label: 'Vence em breve', color: 'bg-amber-100 text-amber-700',     border: 'border-amber-100',   bar: 'bg-amber-400',   icon: Clock        },
  vencido:        { label: 'Vencido',        color: 'bg-red-100 text-red-700',         border: 'border-red-100',     bar: 'bg-red-500',     icon: AlertTriangle },
  sem_data:       { label: 'Sem data',       color: 'bg-gray-100 text-gray-500',       border: 'border-gray-100',    bar: 'bg-gray-300',    icon: FileText     },
};

const TIPOS_DOC = ['CRLV', 'Seguro', 'Licença', 'Tacógrafo', 'ANTT', 'Outros'];

const FILTROS = [
  { value: 'all',            label: 'Todos'          },
  { value: 'vencido',        label: 'Vencidos'       },
  { value: 'vence_em_breve', label: 'Vence em breve' },
  { value: 'ok',             label: 'Válidos'        },
];

const inputCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all';

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Documento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ veiculo_id: '', tipo: 'CRLV', data_vencimento: '', observacao: '', url_anexo: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: docs } = await supabase.from('veiculo_documentos')
        .select('id, veiculo_id, tipo, data_vencimento, observacao, url_anexo').order('tipo');
      const res = await fetch('/api/admin/frota');
      const { veiculos: veics } = await res.json();
      const veiculosData = veics ?? [];
      setVeiculos(veiculosData);
      const enriched = (docs ?? []).map(d => {
        const v = veiculosData.find((x: Veiculo) => x.id === d.veiculo_id);
        return { ...d, veiculo_placa: v?.placa ?? '—', status: getStatus(d.data_vencimento) };
      });
      setDocumentos(enriched);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = filtro === 'all' ? documentos : documentos.filter(d => d.status === filtro);
  const vencidos     = documentos.filter(d => d.status === 'vencido').length;
  const venceEmBreve = documentos.filter(d => d.status === 'vence_em_breve').length;
  const validos      = documentos.filter(d => d.status === 'ok').length;

  function abrirForm(doc?: Documento) {
    if (doc) {
      setEditando(doc);
      setForm({
        veiculo_id: doc.veiculo_id,
        tipo: doc.tipo,
        data_vencimento: doc.data_vencimento ?? '',
        observacao: doc.observacao ?? '',
        url_anexo: doc.url_anexo ?? ''
      });
    } else {
      setEditando(null);
      setForm({ veiculo_id: '', tipo: 'CRLV', data_vencimento: '', observacao: '', url_anexo: '' });
    }
    setShowForm(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `docs/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('fleetflow-docs').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('fleetflow-docs').getPublicUrl(filePath);
      setForm(f => ({ ...f, url_anexo: publicUrl }));
    } catch (err) {
      console.error(err);
      alert('Erro ao subir arquivo.');
    } finally {
      setUploading(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    try {
      const res = await fetch('/api/admin/frota/documentos', {
        method: editando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando
          ? { id: editando.id, data_vencimento: form.data_vencimento, observacao: form.observacao, url_anexo: form.url_anexo }
          : form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowForm(false); load();
    } catch (err) { console.error(err); alert('Erro ao salvar documento.'); }
    finally { setSalvando(false); }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este documento?')) return;
    try {
      const supabase = createClient();
      await supabase.from('veiculo_documentos').delete().eq('id', id);
      load();
    } catch (err) { console.error(err); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Documentos</h1>
          <p className="text-sm text-gray-400 mt-0.5">CRLV, seguros e licenças com alertas de vencimento</p>
        </div>
        <button onClick={() => abrirForm()}
          className="flex items-center gap-1.5 bg-brand-primary text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-brand-primary/25 hover:bg-brand-primary/90 active:scale-95 transition-all">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{vencidos}</p>
          <p className="text-xs text-red-500 font-semibold mt-0.5">Vencidos</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{venceEmBreve}</p>
          <p className="text-xs text-amber-500 font-semibold mt-0.5">Vencem em 30d</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{validos}</p>
          <p className="text-xs text-emerald-500 font-semibold mt-0.5">Válidos</p>
        </div>
      </div>

      {/* Alert banner */}
      {(vencidos > 0 || venceEmBreve > 0) && (
        <div className={`rounded-2xl p-4 flex items-start gap-3 ${vencidos > 0 ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${vencidos > 0 ? 'text-red-500' : 'text-amber-500'}`} />
          <div>
            <p className={`font-bold text-sm ${vencidos > 0 ? 'text-red-800' : 'text-amber-800'}`}>
              {vencidos > 0 ? `${vencidos} documento(s) vencido(s)` : `${venceEmBreve} documento(s) vencendo em breve`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Regularize para evitar multas e autuações.</p>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTROS.map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
              filtro === f.value ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Document cards */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Nenhum documento encontrado</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtrados.map(doc => {
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
                        <span className="text-sm font-black text-gray-900">{doc.veiculo_placa}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">{doc.tipo}</span>
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
                        <button onClick={() => abrirForm(doc)}
                          className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-300 hover:text-gray-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => excluir(doc.id)}
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

      {/* Modal / bottom sheet */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-4 h-4 text-brand-primary" />
                </div>
                <h2 className="text-base font-bold text-gray-900">{editando ? 'Editar Documento' : 'Novo Documento'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              {!editando && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Veículo *</label>
                  <div className="relative">
                    <select className={inputCls + ' appearance-none pr-8'}
                      value={form.veiculo_id} onChange={e => setForm(f => ({ ...f, veiculo_id: e.target.value }))}>
                      <option value="">Selecionar veículo...</option>
                      {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <div className="relative">
                    <select className={inputCls + ' appearance-none pr-8'}
                      value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                      {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Anexo (Foto/PDF)</label>
                  <label className={`flex items-center justify-center gap-2 ${inputCls} cursor-pointer hover:bg-gray-100 transition-colors`}>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : form.url_anexo ? (
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
                <input type="date" className={inputCls} value={form.data_vencimento}
                  onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Observação</label>
                <textarea rows={2} className={inputCls + ' resize-none'} value={form.observacao}
                  onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={salvar} disabled={salvando || uploading || (!editando && !form.veiculo_id)}
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
