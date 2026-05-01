"use client";

import { useState, useEffect, useCallback } from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Plus, X, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Documento {
  id: string;
  veiculo_id: string;
  veiculo_placa?: string;
  tipo: string;
  numero: string | null;
  data_vencimento: string | null;
  observacao: string | null;
  url_anexo: string | null;
  status?: 'ok' | 'vence_em_breve' | 'vencido' | 'sem_data';
}

interface Veiculo {
  id: string;
  placa: string;
  modelo: string;
}

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
  ok:            { label: 'Válido',        color: 'text-green-600 bg-green-50',   icon: CheckCircle },
  vence_em_breve:{ label: 'Vence em breve',color: 'text-yellow-600 bg-yellow-50', icon: Clock },
  vencido:       { label: 'Vencido',       color: 'text-red-600 bg-red-50',       icon: AlertTriangle },
  sem_data:      { label: 'Sem data',      color: 'text-gray-500 bg-gray-100',    icon: FileText },
};

const TIPOS_DOC = ['CRLV', 'Seguro', 'Licença', 'Tacógrafo', 'ANTT', 'Outros'];

export default function DocumentosPage() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Documento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ 
    veiculo_id: '', 
    tipo: 'CRLV', 
    numero: '', 
    data_vencimento: '', 
    observacao: '',
    url_anexo: ''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      // Busca documentos
      const { data: docs } = await supabase
        .from('veiculo_documentos')
        .select('id, veiculo_id, tipo, numero, data_vencimento, observacao, url_anexo')
        .order('tipo');

      // Busca veículos via API para garantir sincronização e bypass de RLS se necessário
      const res = await fetch('/api/admin/frota');
      const { veiculos: veics } = await res.json();

      const veiculosData = veics ?? [];
      setVeiculos(veiculosData);

      const enriched = (docs ?? []).map(d => {
        const v = veiculosData.find((x: Veiculo) => x.id === d.veiculo_id);
        return { ...d, veiculo_placa: v?.placa ?? '—', status: getStatus(d.data_vencimento) };
      });

      setDocumentos(enriched);
    } catch (err) {
      console.error('Erro ao carregar documentos/veículos:', err);
    } finally {
      setLoading(false);
    }
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
        numero: doc.numero ?? '', 
        data_vencimento: doc.data_vencimento ?? '', 
        observacao: doc.observacao ?? '',
        url_anexo: doc.url_anexo ?? ''
      });
    } else {
      setEditando(null);
      setForm({ 
        veiculo_id: '', 
        tipo: 'CRLV', 
        numero: '', 
        data_vencimento: '', 
        observacao: '',
        url_anexo: ''
      });
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
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `documentos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fleetflow-storage') // Usando o bucket padrão do sistema
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('fleetflow-storage')
        .getPublicUrl(filePath);

      setForm(f => ({ ...f, url_anexo: publicUrl }));
    } catch (err) {
      console.error('Erro ao subir arquivo:', err);
      alert('Erro ao subir arquivo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  }

  async function salvar() {
    if (!form.veiculo_id || !form.tipo) {
      alert('Veículo e Tipo são obrigatórios.');
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch('/api/admin/frota/documentos', {
        method: editando ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editando 
          ? { 
              id: editando.id, 
              numero: form.numero, 
              data_vencimento: form.data_vencimento, 
              observacao: form.observacao,
              url_anexo: form.url_anexo
            }
          : form
        ),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setShowForm(false);
      load();
    } catch (err) {
      console.error('Erro ao salvar documento:', err);
      alert('Erro ao salvar documento. Verifique os dados e tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este documento?')) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('veiculo_documentos').delete().eq('id', id);
      if (error) throw error;
      load();
    } catch (err) {
      console.error('Erro ao excluir documento:', err);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-brand-primary" /> Documentos da Frota
          </h1>
          <p className="text-gray-500 text-sm mt-1">CNH, CRLV, seguros com alertas de vencimento</p>
        </div>
        <button onClick={() => abrirForm()}
          className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium">
          <Plus className="w-4 h-4" /> Novo Documento
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Vencidos</p>
          <p className="text-3xl font-bold mt-1 text-red-600">{vencidos}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Vencem em 30 dias</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">{venceEmBreve}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Válidos</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{validos}</p>
        </div>
      </div>

      {/* Alerta */}
      {(vencidos > 0 || venceEmBreve > 0) && (
        <div className={`rounded-xl p-4 flex items-start gap-3 ${vencidos > 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${vencidos > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
          <div>
            <p className={`font-medium text-sm ${vencidos > 0 ? 'text-red-800' : 'text-yellow-800'}`}>
              {vencidos > 0 ? `${vencidos} documento(s) vencido(s)` : `${venceEmBreve} documento(s) vencendo em breve`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Regularize a documentação para evitar multas e autuações.</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'vencido', label: 'Vencidos' },
          { value: 'vence_em_breve', label: 'Vence em breve' },
          { value: 'ok', label: 'Válidos' },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filtro === f.value ? 'bg-brand-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum documento encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Veículo', 'Tipo', 'Número', 'Vencimento', 'Status', 'Anexo', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map(doc => {
                  const st = doc.status ?? 'sem_data';
                  const sc = STATUS_CONFIG[st as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.sem_data;
                  const Icon = sc.icon;
                  return (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{doc.veiculo_placa}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary">{doc.tipo}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono">{doc.numero || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {doc.data_vencimento ? new Date(doc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                          <Icon className="w-3 h-3" /> {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {doc.url_anexo ? (
                          <a href={doc.url_anexo} target="_blank" rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
                            <Paperclip className="w-4 h-4" />
                            <span className="text-[10px] font-bold">VER ANEXO</span>
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => abrirForm(doc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => excluir(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{editando ? 'Editar Documento' : 'Novo Documento'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Veículo *</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                      value={form.veiculo_id} onChange={e => setForm(f => ({ ...f, veiculo_id: e.target.value }))}>
                      <option value="">Selecionar veículo...</option>
                      {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo de Documento</label>
                <div className="relative">
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                    {TIPOS_DOC.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Número / Protocolo</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de Vencimento</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
                  value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} />
              </div>

              {/* Seção de Anexo */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Anexo (Foto/PDF)</label>
                <div className="flex items-center gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                    form.url_anexo ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-brand-primary/50'
                  }`}>
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" disabled={uploading} />
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : form.url_anexo ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">Arquivo pronto!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        <span className="text-sm font-bold">Subir anexo</span>
                      </>
                    )}
                  </label>
                  {form.url_anexo && (
                    <a href={form.url_anexo} target="_blank" rel="noopener noreferrer" className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-brand-primary transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={salvar} disabled={salvando || uploading || (!editando && !form.veiculo_id)}
                className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
