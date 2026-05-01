"use client";

import { AlertTriangle, User, Truck, MessageSquare, CheckCircle, XCircle, Info, Camera, Plus, ChevronRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type Occ = {
  id: string; id_real: string; veiculo: string; motorista: string;
  tipo: string; gravidade: string; status: string; data: string;
  hora: string; descricao: string; local: string;
};

const GRAV: Record<string, { pill: string; bar: string; label: string }> = {
  'Grave': { pill: 'bg-red-100 text-red-700',    bar: 'bg-red-500',    label: 'Grave'  },
  'Média': { pill: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400',  label: 'Média'  },
  'Leve':  { pill: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-400',   label: 'Leve'   },
};

const STATUS: Record<string, { pill: string; icon: React.ElementType }> = {
  'Aberta':       { pill: 'bg-amber-100 text-amber-700',   icon: Clock        },
  'Em Tratativa': { pill: 'bg-blue-100 text-blue-700',     icon: MessageSquare},
  'Concluída':    { pill: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

const FILTERS = ['Todas', 'Aberta', 'Em Tratativa', 'Concluída'];

export default function OccurrencesPage() {
  const [occurrences, setOccurrences] = useState<Occ[]>([]);
  const [selectedOcc, setSelectedOcc] = useState<Occ | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filter, setFilter] = useState('Todas');

  const fetchOccurrences = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ocorrencias')
        .select('id, codigo, placa, motorista_nome, categoria, gravidade, status, descricao, local, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOccurrences((data || []).map((o) => ({
        id: o.codigo || o.id, id_real: o.id, veiculo: o.placa || '',
        motorista: o.motorista_nome || '', tipo: o.categoria || '',
        gravidade: o.gravidade, status: o.status,
        data: new Date(o.created_at).toLocaleDateString('pt-BR'),
        hora: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        descricao: o.descricao || '', local: '',
      })));
    } catch { setOccurrences([]); }
  };

  useEffect(() => { fetchOccurrences(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleEncaminhar = async (occ: Occ) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('ocorrencias').update({ status: 'Em Tratativa' }).eq('id', occ.id_real);
      if (error) throw error;
      setOccurrences(prev => prev.map(o => o.id_real === occ.id_real ? { ...o, status: 'Em Tratativa' } : o));
      setSelectedOcc(prev => prev?.id_real === occ.id_real ? { ...prev, status: 'Em Tratativa' } : prev);
      showToast(`🔧 Ocorrência ${occ.id} encaminhada!`);
    } catch { showToast('⚠️ Erro ao atualizar.'); }
  };

  const handleResolver = async (occ: Occ) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('ocorrencias').update({ status: 'Concluída' }).eq('id', occ.id_real);
      if (error) throw error;
      setOccurrences(prev => prev.map(o => o.id_real === occ.id_real ? { ...o, status: 'Concluída' } : o));
      setSelectedOcc(null);
      showToast(`✅ Ocorrência ${occ.id} resolvida!`);
    } catch { showToast('⚠️ Erro ao atualizar.'); }
  };

  const filtered = filter === 'Todas' ? occurrences : occurrences.filter(o => o.status === filter);
  const graves = occurrences.filter(o => o.gravidade === 'Grave' && o.status !== 'Concluída').length;
  const abertas = occurrences.filter(o => o.status === 'Aberta').length;
  const resolvidas = occurrences.filter(o => o.status === 'Concluída').length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      {/* Drawer detalhe (mobile bottom sheet / desktop aside) */}
      {selectedOcc && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setSelectedOcc(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
            <DrawerContent occ={selectedOcc} onClose={() => setSelectedOcc(null)}
              onEncaminhar={handleEncaminhar} onResolver={handleResolver} showToast={showToast} />
          </div>
        </>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Ocorrências</h1>
        <p className="text-sm text-gray-400 mt-0.5">Monitoramento de incidentes em tempo real</p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{graves}</p>
          <p className="text-xs text-red-500 font-semibold mt-0.5">Graves</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{abertas}</p>
          <p className="text-xs text-amber-500 font-semibold mt-0.5">Em Aberto</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{resolvidas}</p>
          <p className="text-xs text-emerald-500 font-semibold mt-0.5">Resolvidas</p>
        </div>
      </div>

      {/* Filtros por status */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === f ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/25' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {/* Layout split desktop */}
      <div className="flex gap-5">
        {/* Lista */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma ocorrência encontrada</p>
            </div>
          )}
          {filtered.map((occ) => {
            const g = GRAV[occ.gravidade] ?? GRAV['Leve'];
            const s = STATUS[occ.status] ?? STATUS['Aberta'];
            const StatusIcon = s.icon;
            const isSelected = selectedOcc?.id_real === occ.id_real;
            return (
              <button key={occ.id_real} onClick={() => setSelectedOcc(isSelected ? null : occ)}
                className={`w-full text-left bg-white rounded-2xl border transition-all flex items-stretch overflow-hidden hover:shadow-md active:scale-[.99] ${
                  isSelected ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-md' : 'border-gray-100'
                }`}>
                {/* Severity bar */}
                <div className={`w-1 shrink-0 ${g.bar}`} />
                <div className="flex-1 px-4 py-3.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-gray-400 font-mono">{occ.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.pill}`}>{g.label}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm truncate">{occ.tipo || 'Ocorrência'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Truck className="w-3 h-3" />{occ.veiculo}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" />{occ.motorista}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.pill}`}>
                      <StatusIcon className="w-3 h-3" />{occ.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{occ.data} · {occ.hora}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalhe lateral — desktop only */}
        <div className="hidden md:block w-80 shrink-0">
          {selectedOcc ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden">
              <DrawerContent occ={selectedOcc} onClose={() => setSelectedOcc(null)}
                onEncaminhar={handleEncaminhar} onResolver={handleResolver} showToast={showToast} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center sticky top-24">
              <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-medium">Selecione uma ocorrência<br/>para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Drawer / Detail Panel ─────────────────────────────────────── */
function DrawerContent({ occ, onClose, onEncaminhar, onResolver, showToast }: {
  occ: Occ; onClose: () => void;
  onEncaminhar: (o: Occ) => void; onResolver: (o: Occ) => void;
  showToast: (m: string) => void;
}) {
  const g = GRAV[occ.gravidade] ?? GRAV['Leve'];
  const s = STATUS[occ.status] ?? STATUS['Aberta'];
  return (
    <div className="p-5 space-y-5">
      {/* Handle + header */}
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto md:hidden" />
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-gray-400 font-mono">{occ.id}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${g.pill}`}>{g.label}</span>
          </div>
          <h3 className="font-bold text-gray-900">{occ.tipo || 'Ocorrência'}</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <XCircle className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-2">
        {[
          { icon: Truck, label: 'Veículo', value: occ.veiculo },
          { icon: User, label: 'Motorista', value: occ.motorista },
          { icon: Info, label: 'Data / Hora', value: `${occ.data} às ${occ.hora}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Icon className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">{label}</p>
              <p className="text-sm font-bold text-gray-800">{value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Descrição */}
      {occ.descricao && (
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Relato</p>
          <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 italic">"{occ.descricao}"</p>
        </div>
      )}

      {/* Fotos */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Evidências</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="aspect-square bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
            <Camera className="w-5 h-5 text-gray-300" />
          </div>
          <button onClick={() => showToast('📷 Upload em breve.')}
            className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <Plus className="w-5 h-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Status atual */}
      <div className={`flex items-center justify-center gap-2 py-2 rounded-xl ${s.pill}`}>
        <p className="text-xs font-bold">Status: {occ.status}</p>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <button onClick={() => onEncaminhar(occ)}
          disabled={occ.status === 'Concluída' || occ.status === 'Em Tratativa'}
          className="w-full bg-brand-primary text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-primary/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20">
          <MessageSquare className="w-4 h-4" /> Encaminhar para Oficina
        </button>
        <button onClick={() => onResolver(occ)}
          disabled={occ.status === 'Concluída'}
          className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
          <CheckCircle className="w-4 h-4" /> Marcar como Resolvida
        </button>
      </div>
    </div>
  );
}
