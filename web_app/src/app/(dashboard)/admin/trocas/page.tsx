"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Truck, ArrowRight, CheckCircle2, AlertCircle, Camera, ShieldCheck, X, ChevronRight, Clock } from 'lucide-react';

type Exchange = {
  id: string; id_real: string; motorista: string; de: string; para: string;
  data: string; status: string; motivo: string; assinatura: string;
  laudoDevolucao: { oleo: boolean; pneus: boolean; luzes: boolean; limpeza: boolean; avaria: string | null };
  laudoRetirada:  { oleo: boolean; pneus: boolean; luzes: boolean; limpeza: boolean; kit: boolean };
};

const STATUS_CFG: Record<string, { pill: string; bar: string; icon: React.ElementType }> = {
  'Pendente': { pill: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400',   icon: Clock       },
  'Aprovada': { pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', icon: CheckCircle2 },
  'Recusada': { pill: 'bg-red-100 text-red-700',     bar: 'bg-red-500',     icon: AlertCircle },
};

export default function VehicleExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchExchanges = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('trocas')
        .select('id, codigo, motorista_nome, veiculo_antigo_nome, veiculo_novo_nome, status, motivo, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setExchanges((data || []).map(t => ({
        id: t.codigo || t.id, id_real: t.id,
        motorista: t.motorista_nome || '', de: t.veiculo_antigo_nome || '', para: t.veiculo_novo_nome || '',
        data: new Date(t.created_at).toLocaleDateString('pt-BR') + ', ' +
              new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: t.status, motivo: t.motivo || '', assinatura: '',
        laudoDevolucao: { oleo: true, pneus: true, luzes: true, limpeza: true, avaria: null },
        laudoRetirada:  { oleo: true, pneus: true, luzes: true, limpeza: true, kit: true },
      })));
    } catch { setExchanges([]); }
  };

  useEffect(() => { fetchExchanges(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleAprovar = async (exchange: Exchange) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('trocas').update({ status: 'Aprovada' }).eq('id', exchange.id_real);
      if (error) throw error;
      await fetchExchanges(); setSelectedExchange(null);
      showToast(`✅ Troca ${exchange.id} aprovada!`);
    } catch { showToast('⚠️ Erro ao aprovar troca.'); }
  };

  const handleRecusar = async (exchange: Exchange) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('trocas').update({ status: 'Recusada' }).eq('id', exchange.id_real);
      if (error) throw error;
      await fetchExchanges(); setSelectedExchange(null);
      showToast('Troca recusada. Motorista deve refazer o checklist.');
    } catch { showToast('⚠️ Erro ao recusar troca.'); }
  };

  const pendentes  = exchanges.filter(e => e.status === 'Pendente').length;
  const aprovadas  = exchanges.filter(e => e.status === 'Aprovada').length;
  const recusadas  = exchanges.filter(e => e.status === 'Recusada').length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      {/* Mobile overlay */}
      {selectedExchange && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setSelectedExchange(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
            <ExchangeDetail ex={selectedExchange} onClose={() => setSelectedExchange(null)}
              onAprovar={handleAprovar} onRecusar={handleRecusar} />
          </div>
        </>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Auditoria de Trocas</h1>
        <p className="text-sm text-gray-400 mt-0.5">Validação de devolução e entrega de veículos da frota</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-amber-600">{pendentes}</p>
          <p className="text-xs text-amber-500 font-semibold mt-0.5">Pendentes</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-600">{aprovadas}</p>
          <p className="text-xs text-emerald-500 font-semibold mt-0.5">Aprovadas</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-red-600">{recusadas}</p>
          <p className="text-xs text-red-500 font-semibold mt-0.5">Recusadas</p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-5">
        {/* Exchange list */}
        <div className="flex-1 space-y-2.5 min-w-0">
          {exchanges.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Nenhuma troca registrada</p>
            </div>
          ) : exchanges.map(ex => {
            const sc = STATUS_CFG[ex.status] ?? STATUS_CFG['Pendente'];
            const StatusIcon = sc.icon;
            const isSelected = selectedExchange?.id_real === ex.id_real;
            return (
              <button key={ex.id_real} onClick={() => setSelectedExchange(isSelected ? null : ex)}
                className={`w-full text-left bg-white rounded-2xl border transition-all flex items-stretch overflow-hidden hover:shadow-md active:scale-[.99] ${
                  isSelected ? 'border-brand-primary ring-2 ring-brand-primary/10 shadow-md' : 'border-gray-100'
                }`}>
                <div className={`w-1 shrink-0 ${sc.bar}`} />
                <div className="flex-1 px-4 py-3.5 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-brand-primary">{ex.motorista.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-black text-gray-400 font-mono">{ex.id}</span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm truncate">{ex.motorista}</p>
                    {/* Vehicle swap */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded truncate max-w-[80px]">{ex.de}</span>
                      <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded truncate max-w-[80px]">{ex.para}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.pill}`}>
                      <StatusIcon className="w-3 h-3" />{ex.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{ex.data}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 mt-0.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop side panel */}
        <div className="hidden md:block w-80 shrink-0">
          {selectedExchange ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm sticky top-24 overflow-hidden max-h-[80vh] overflow-y-auto">
              <ExchangeDetail ex={selectedExchange} onClose={() => setSelectedExchange(null)}
                onAprovar={handleAprovar} onRecusar={handleRecusar} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center sticky top-24">
              <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-xs text-gray-400 font-medium">Selecione uma troca<br/>para auditar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detail Panel ─────────────────────────────────────────── */
function ExchangeDetail({ ex, onClose, onAprovar, onRecusar }: {
  ex: Exchange; onClose: () => void;
  onAprovar: (e: Exchange) => void; onRecusar: (e: Exchange) => void;
}) {
  const sc = STATUS_CFG[ex.status] ?? STATUS_CFG['Pendente'];
  const StatusIcon = sc.icon;
  return (
    <div>
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 md:hidden" />
      <div className="flex items-start justify-between p-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-gray-400 font-mono">{ex.id}</span>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.pill}`}>
              <StatusIcon className="w-3 h-3" />{ex.status}
            </span>
          </div>
          <p className="font-bold text-gray-900">{ex.motorista}</p>
          <p className="text-xs text-gray-400 mt-0.5">{ex.data}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Vehicle swap */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
          <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <Truck className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">Entrega</p>
            <p className="text-xs font-black text-gray-800 truncate">{ex.de}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
          <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <Truck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[10px] font-bold text-emerald-700 uppercase mb-0.5">Recebimento</p>
            <p className="text-xs font-black text-gray-800 truncate">{ex.para}</p>
          </div>
        </div>

        {/* Laudo devolução */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Laudo de Devolução</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Mecânica/Elétrica', ok: ex.laudoDevolucao.oleo },
              { label: 'Pneus', ok: ex.laudoDevolucao.pneus },
              { label: 'Luzes', ok: ex.laudoDevolucao.luzes },
              { label: 'Higiene', ok: ex.laudoDevolucao.limpeza },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center px-4 py-2">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {item.ok ? 'Conforme' : 'Reprovado'}
                </span>
              </div>
            ))}
          </div>
          {ex.laudoDevolucao.avaria && (
            <div className="mx-4 mb-3 flex items-start gap-2 bg-red-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{ex.laudoDevolucao.avaria}</p>
            </div>
          )}
        </div>

        {/* Laudo retirada */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-black text-gray-700 uppercase tracking-wider">Laudo de Retirada</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Filtros/Óleo', ok: ex.laudoRetirada.oleo },
              { label: 'Pneus', ok: ex.laudoRetirada.pneus },
              { label: 'Kit Emergência', ok: ex.laudoRetirada.kit },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center px-4 py-2">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {item.ok ? 'Conforme' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-3 flex items-center gap-2 bg-emerald-50 rounded-xl p-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-700">Vistoria realizada com sucesso</p>
          </div>
        </div>

        {/* Evidências */}
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />Evidências
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                <Camera className="w-4 h-4 text-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Assinatura */}
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center">
          <p className="font-serif italic font-black text-gray-700 text-lg underline decoration-brand-primary/30 decoration-2 underline-offset-4">
            {ex.motorista}
          </p>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-2">Assinatura Digital Verificada</p>
        </div>
      </div>

      {/* Actions */}
      {ex.status === 'Pendente' && (
        <div className="border-t border-gray-100 p-4 flex gap-2 bg-white">
          <button onClick={() => onRecusar(ex)}
            className="flex-1 py-3 rounded-2xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors">
            Bloquear
          </button>
          <button onClick={() => onAprovar(ex)}
            className="flex-[2] py-3 rounded-2xl bg-brand-primary text-white text-xs font-bold hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />Aprovar Troca
          </button>
        </div>
      )}
    </div>
  );
}
