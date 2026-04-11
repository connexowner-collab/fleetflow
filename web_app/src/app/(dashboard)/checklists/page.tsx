"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, AlertTriangle, CheckCircle2, Clock, Car, User, Camera, ClipboardCheck, X, FileSignature, AlertOctagon } from 'lucide-react';

type ChecklistItem = { nome: string; conforme: boolean };
type ChecklistFoto = { tipo: string; url: string };

type Inspection = {
  id: string;
  id_real: string;
  motorista: string;
  placa: string;
  data: string;
  status: string;
  km: string;
  tem_avaria: boolean;
};

export default function ChecklistsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [selectedItens, setSelectedItens] = useState<ChecklistItem[]>([]);
  const [selectedFotos, setSelectedFotos] = useState<ChecklistFoto[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchInspections = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('checklists')
        .select('id, codigo, motorista_nome, placa, km_atual, status, tem_avaria, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInspections(
        (data || []).map((c) => ({
          id: c.codigo || c.id,
          id_real: c.id,
          motorista: c.motorista_nome || '',
          placa: c.placa || '',
          data:
            new Date(c.created_at).toLocaleDateString('pt-BR') +
            ', ' +
            new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: c.status || 'Pendente',
          km: c.km_atual?.toLocaleString('pt-BR') ?? '0',
          tem_avaria: c.tem_avaria ?? false,
        }))
      );
    } catch {
      setInspections([]);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleSelectInspection = async (insp: Inspection) => {
    setSelectedInspection(insp);
    setSelectedItens([]);
    setSelectedFotos([]);
    setLoadingDetail(true);
    try {
      const supabase = createClient();
      const [itensRes, fotosRes] = await Promise.all([
        supabase.from('checklist_itens').select('nome, conforme').eq('checklist_id', insp.id_real),
        supabase.from('checklist_fotos').select('tipo, url').eq('checklist_id', insp.id_real),
      ]);
      setSelectedItens(itensRes.data ?? []);
      setSelectedFotos(fotosRes.data ?? []);
    } catch {
      // silently fail — drawer still shows
    } finally {
      setLoadingDetail(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAprovar = async (inspection: Inspection) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('checklists')
        .update({ status: 'Aprovado' })
        .eq('id', inspection.id_real);
      if (error) throw error;
      setInspections(prev => prev.map(insp => insp.id_real === inspection.id_real ? { ...insp, status: 'Aprovado' } : insp));
      setSelectedInspection(null);
      showToast(`Inspeção ${inspection.id} aprovada com sucesso!`);
    } catch {
      showToast('Erro ao aprovar inspeção.');
    }
  };

  const handleRecusar = async (inspection: Inspection) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('checklists')
        .update({ status: 'Avaria Grave' })
        .eq('id', inspection.id_real);
      if (error) throw error;
      setInspections(prev => prev.map(insp => insp.id_real === inspection.id_real ? { ...insp, status: 'Avaria Grave' } : insp));
      setSelectedInspection(null);
      showToast(`Inspeção ${inspection.id} recusada. Veículo bloqueado para saída.`);
    } catch {
      showToast('Erro ao recusar inspeção.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Aprovado': return <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold flex items-center w-fit shadow-sm border border-green-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Liberado</span>;
      case 'Pendente': return <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold flex items-center w-fit shadow-sm border border-yellow-200"><Clock className="w-3.5 h-3.5 mr-1" /> Em Revisão</span>;
      case 'Avaria Grave': return <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold flex items-center w-fit shadow-sm border border-red-200"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Risco (Recusado)</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-bold w-fit border border-gray-200">{status}</span>;
    }
  };

  const filtered = inspections.filter(insp => {
    const matchSearch = !search || insp.placa.toLowerCase().includes(search.toLowerCase()) || insp.motorista.toLowerCase().includes(search.toLowerCase()) || insp.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || insp.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const conformes = selectedItens.filter(i => i.conforme).length;
  const naoConformes = selectedItens.filter(i => !i.conforme).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col relative pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <ClipboardCheck className="w-8 h-8 mr-3 text-brand-primary" />
            Central de Inspeções Diárias
          </h1>
          <p className="text-gray-500 mt-2">Validação e liberação dos checklists operacionais recebidos pelo App do Motorista.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar placa, motorista..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white text-gray-700"
          >
            <option value="">Todos</option>
            <option value="Pendente">Em Revisão</option>
            <option value="Aprovado">Liberado</option>
            <option value="Avaria Grave">Recusado</option>
          </select>
        </div>
      </div>

      {/* Grid de Checklists */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <ClipboardCheck className="w-12 h-12 mb-4 opacity-30" />
          <p className="font-semibold">Nenhum checklist encontrado</p>
          <p className="text-sm mt-1">Ajuste os filtros ou aguarde novos envios pelo app.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {filtered.map((insp) => (
            <div
              key={insp.id_real}
              onClick={() => handleSelectInspection(insp)}
              className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 cursor-pointer hover:shadow-xl hover:border-brand-primary/30 hover:-translate-y-1 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-brand-primary/10 transition-colors" />

              <div className="flex justify-between items-start mb-6 relative">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{insp.id}</span>
                  <h3 className="text-xl font-black text-gray-900 mt-1 flex items-center">
                    <Car className="w-5 h-5 mr-3 text-brand-primary" />
                    {insp.placa}
                  </h3>
                </div>
                {getStatusBadge(insp.status)}
              </div>

              <div className="space-y-3 mb-6 relative">
                <div className="flex items-center text-sm font-bold text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-[10px] text-brand-primary">
                    {insp.motorista.substring(0,2).toUpperCase()}
                  </div>
                  {insp.motorista}
                </div>
                <p className="text-xs text-gray-400 flex items-center font-bold">
                  <Clock className="w-3.5 h-3.5 mr-2" />
                  ENVIADO: {insp.data.toUpperCase()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-100 group-hover:bg-brand-primary/5 group-hover:border-brand-primary/10 transition-all">
                <div className="text-left px-2">
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Odômetro</span>
                  <span className="font-black text-lg text-gray-900 tracking-tight">{insp.km}</span>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div className="text-right px-2">
                  <span className="block text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Avaria</span>
                  <span className={`font-black text-sm ${insp.tem_avaria ? 'text-red-600' : 'text-green-600'}`}>
                    {insp.tem_avaria ? 'REPORTADA' : 'NENHUMA'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over de Auditoria */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedInspection(null)}></div>
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-xl transform animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">

                {/* Header */}
                <div className="bg-gray-900 px-8 py-10 flex items-center justify-between relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-20 blur-3xl rounded-bl-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
                  <div className="z-10">
                    <span className="bg-brand-secondary text-brand-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">Módulo de Auditoria</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter">{selectedInspection.id}</h2>
                    <p className="text-gray-400 font-bold mt-1 text-sm uppercase tracking-wider">
                      Veículo: <span className="text-white">{selectedInspection.placa}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedInspection(null)} className="rounded-xl text-gray-400 hover:text-white focus:outline-none p-2 bg-white/5 hover:bg-white/10 transition-all z-20 border border-white/10">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative flex-1 px-8 py-8 space-y-8 flex flex-col justify-start overflow-y-auto bg-gray-50/50">

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Condutor</p>
                      <p className="font-black text-gray-900 flex items-center text-base"><User className="w-4 h-4 mr-2 text-brand-primary/50" /> {selectedInspection.motorista}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Odômetro</p>
                      <p className="font-black text-2xl text-brand-primary tracking-tighter">{selectedInspection.km} <span className="text-xs text-gray-400">km</span></p>
                    </div>
                  </div>

                  {/* Itens de Inspeção */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 mb-5 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center"><AlertOctagon className="w-5 h-5 mr-3 text-red-500" /> Itens de Inspeção</span>
                      {!loadingDetail && selectedItens.length > 0 && (
                        <span className="text-xs font-bold text-gray-400">{conformes} OK · {naoConformes} alerta</span>
                      )}
                    </h3>
                    {loadingDetail ? (
                      <div className="space-y-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
                      </div>
                    ) : selectedItens.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Nenhum item registrado.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedItens.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                            <span className="text-sm font-bold text-gray-700 italic">{item.nome}</span>
                            {item.conforme ? (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase border border-green-200">Conforme</span>
                            ) : (
                              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase border border-red-200 animate-pulse">Avaria</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Evidências Fotográficas */}
                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider flex items-center">
                      <Camera className="w-5 h-5 mr-3 text-brand-primary" /> Evidências Fotográficas
                    </h3>
                    {loadingDetail ? (
                      <div className="grid grid-cols-2 gap-4">
                        {[1,2].map(i => <div key={i} className="aspect-video bg-gray-100 rounded-2xl animate-pulse" />)}
                      </div>
                    ) : selectedFotos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedFotos.map((foto, idx) => (
                          <a key={idx} href={foto.url} target="_blank" rel="noopener noreferrer" className="aspect-video rounded-2xl overflow-hidden border border-gray-200 group relative">
                            <img src={foto.url} alt={foto.tipo} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
                              <p className="text-white text-[10px] font-black text-center uppercase tracking-widest">{foto.tipo}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {['Dianteira', 'Traseira'].map(label => (
                          <div key={label} className="aspect-video bg-gray-100 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                            <Camera className="w-8 h-8 mb-1 opacity-40" />
                            <span className="text-[10px] font-black uppercase">{label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assinatura */}
                  <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
                    <FileSignature className="w-8 h-8 text-gray-300 mb-3" />
                    <p className="text-3xl font-serif italic font-black text-gray-800 decoration-brand-secondary decoration-2 underline underline-offset-8">
                      {selectedInspection.motorista}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-5">Assinatura Digital via Fingerprint</p>
                  </div>
                </div>

                {/* Footer de Ações */}
                <div className="border-t border-gray-200 px-8 py-6 bg-white flex justify-end gap-4 shadow-[0_-15px_35px_-5px_rgba(0,0,0,0.05)] shrink-0">
                  <button
                    onClick={() => handleRecusar(selectedInspection)}
                    disabled={selectedInspection.status !== 'Pendente'}
                    className="px-6 py-4 text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl transition-all mr-auto uppercase tracking-widest border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Recusar Checklist
                  </button>
                  <button
                    onClick={() => handleAprovar(selectedInspection)}
                    disabled={selectedInspection.status !== 'Pendente'}
                    className="px-10 py-4 text-xs font-black text-white bg-green-600 border border-transparent rounded-2xl shadow-xl shadow-green-600/20 hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-3" />
                    Validar e Liberar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
