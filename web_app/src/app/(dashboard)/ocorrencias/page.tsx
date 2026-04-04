"use client";

import { AlertTriangle, MapPin, User, Truck, MessageSquare, CheckCircle, XCircle, Info, Camera, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type Occ = {
  id: string;
  id_real: string;
  veiculo: string;
  motorista: string;
  tipo: string;
  gravidade: string;
  status: string;
  data: string;
  hora: string;
  descricao: string;
  local: string;
};

const severityStyles: Record<string, string> = {
  'Grave': 'bg-red-100 text-red-700 border-red-200',
  'Média': 'bg-orange-100 text-orange-700 border-orange-200',
  'Leve': 'bg-blue-100 text-blue-700 border-blue-200',
};

const statusStyles: Record<string, string> = {
  'Aberta': 'bg-yellow-100 text-yellow-700',
  'Em Tratativa': 'bg-blue-100 text-blue-700',
  'Concluída': 'bg-green-100 text-green-700',
};

export default function OccurrencesPage() {
  const [occurrences, setOccurrences] = useState<Occ[]>([]);
  const [selectedOcc, setSelectedOcc] = useState<Occ | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchOccurrences = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('id, codigo, placa, motorista, categoria, gravidade, status, descricao, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOccurrences(
        (data || []).map((o) => ({
          id: o.codigo || o.id,
          id_real: o.id,
          veiculo: o.placa || '',
          motorista: o.motorista || '',
          tipo: o.categoria || '',
          gravidade: o.gravidade,
          status: o.status,
          data: new Date(o.created_at).toLocaleDateString('pt-BR'),
          hora: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          descricao: o.descricao || '',
          local: '',
        }))
      );
    } catch {
      setOccurrences([]);
    }
  };

  useEffect(() => {
    fetchOccurrences();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleEncaminhar = async (occ: Occ) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ocorrencias')
        .update({ status: 'Em Tratativa' })
        .eq('id', occ.id_real);
      if (error) throw error;
      setOccurrences((prev) =>
        prev.map((o) => o.id_real === occ.id_real ? { ...o, status: 'Em Tratativa' } : o)
      );
      setSelectedOcc((prev) => prev?.id_real === occ.id_real ? { ...prev, status: 'Em Tratativa' } : prev);
      showToast(`🔧 Ocorrência ${occ.id} encaminhada para oficina!`);
    } catch {
      showToast('⚠️ Erro ao atualizar ocorrência.');
    }
  };

  const handleResolver = async (occ: Occ) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ocorrencias')
        .update({ status: 'Concluída' })
        .eq('id', occ.id_real);
      if (error) throw error;
      setOccurrences((prev) =>
        prev.map((o) => o.id_real === occ.id_real ? { ...o, status: 'Concluída' } : o)
      );
      setSelectedOcc(null);
      showToast(`✅ Ocorrência ${occ.id} marcada como resolvida!`);
    } catch {
      showToast('⚠️ Erro ao atualizar ocorrência.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <AlertTriangle className="w-8 h-8 mr-3 text-red-600" />
            Vigilância de Ocorrências
          </h1>
          <p className="text-gray-500 mt-1">Monitoramento em tempo real de incidentes e avarias reportadas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estatísticas */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase">Alertas Graves</p>
              <p className="text-3xl font-black text-red-900 leading-none mt-1">
                {occurrences.filter(o => o.gravidade === 'Grave' && o.status !== 'Concluída').length}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-300" />
          </div>
          <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-yellow-600 uppercase">Em Aberto</p>
              <p className="text-3xl font-black text-yellow-900 leading-none mt-1">
                {occurrences.filter(o => o.status === 'Aberta').length}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-300" />
          </div>
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase">Resolvidas</p>
              <p className="text-3xl font-black text-green-900 leading-none mt-1">
                {occurrences.filter(o => o.status === 'Concluída').length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-300" />
          </div>
        </div>

        {/* Lista de Ocorrências */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest pl-2">Timeline de Incidentes</h3>
          {occurrences.map((occ) => (
            <div
              key={occ.id_real}
              className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-lg ${selectedOcc?.id_real === occ.id_real ? 'border-brand-primary ring-2 ring-brand-primary/10' : 'border-gray-100'}`}
              onClick={() => setSelectedOcc(occ)}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded uppercase tracking-tighter">{occ.id}</span>
                    <span className={`px-3 py-0.5 text-[10px] font-black rounded-full border ${severityStyles[occ.gravidade]}`}>
                      {occ.gravidade.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-gray-900">{occ.tipo}</h4>
                  <div className="flex items-center text-sm text-gray-500 space-x-3">
                    <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {occ.motorista}</span>
                    <span className="flex items-center"><Truck className="w-3 h-3 mr-1" /> {occ.veiculo}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 mb-1">{occ.data}</p>
                  <span className={`px-2 py-1 rounded text-[10px] font-black ${statusStyles[occ.status]}`}>{occ.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Painel de Detalhes */}
        <div className="lg:col-span-1">
          {selectedOcc ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden sticky top-6">
              <div className={`p-6 ${severityStyles[selectedOcc.gravidade]}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-lg">Detalhes da Ocorrência</h3>
                  <button
                    onClick={() => setSelectedOcc(null)}
                    className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 transition-colors"
                    aria-label="Fechar painel"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center bg-white/20 p-3 rounded-xl backdrop-blur-md">
                    <MapPin className="w-5 h-5 mr-3" />
                    <p className="text-xs font-bold leading-tight">{selectedOcc.local}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                    <Info className="w-3 h-3 mr-1" /> Relato do Motorista
                  </h5>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
                    "{selectedOcc.descricao}"
                  </p>
                </div>

                <div>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                    <Camera className="w-3 h-3 mr-1" /> Evidências Fotográficas
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 font-bold text-[10px]">FOTO 01</div>
                    <div className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 font-bold text-[10px]">FOTO 02</div>
                    <button
                      onClick={() => showToast('📷 Upload de fotos em desenvolvimento.')}
                      className="aspect-square bg-gray-200/50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status atual badge */}
                <div className="flex items-center justify-center">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black ${statusStyles[selectedOcc.status]}`}>
                    Status atual: {selectedOcc.status}
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleEncaminhar(selectedOcc)}
                    disabled={selectedOcc.status === 'Concluída' || selectedOcc.status === 'Em Tratativa'}
                    className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold transition-all hover:shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Encaminhar para Oficina
                  </button>
                  <button
                    onClick={() => handleResolver(selectedOcc)}
                    disabled={selectedOcc.status === 'Concluída'}
                    className="w-full bg-green-500 text-white py-3 rounded-xl font-bold transition-all hover:shadow-lg active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Analisada e Resolvida
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <AlertTriangle className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-400">Selecione uma ocorrência<br />para auditar os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
