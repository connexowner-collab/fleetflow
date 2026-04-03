"use client";

import { useState } from 'react';
import { Truck, User, ArrowRight, Eye, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Camera, ShieldCheck, Calendar, X } from 'lucide-react';

const initialExchanges = [
  { 
    id: 'TR-501', 
    motorista: 'Roberto Alves', 
    de: 'Volvo FH 540 (ABC-1234)', 
    para: 'Scania R450 (XYZ-9876)', 
    data: 'Hoje, 09:45', 
    status: 'Pendente',
    motivo: 'Fim do turno / Manutenção preventivas do Volvo',
    assinatura: 'Roberto Alves - Digitalmente em 31/03/2026 09:45',
    laudoDevolucao: {
      oleo: true, pneus: true, luzes: true, limpeza: false, avaria: 'Arranhão leve para-choque frontal'
    },
    laudoRetirada: {
      oleo: true, pneus: true, luzes: true, limpeza: true, kit: true
    }
  },
  { 
    id: 'TR-502', 
    motorista: 'Carlos Silva', 
    de: 'Mercedes Axor (GHI-5678)', 
    para: 'DAF XF (JKL-9012)', 
    data: 'Hoje, 11:20', 
    status: 'Aprovada',
    motivo: 'Escalar carga pesada para DAF',
    assinatura: 'Carlos Silva - Digitalmente em 31/03/2026 11:30',
    laudoDevolucao: { oleo: true, pneus: true, luzes: true, limpeza: true, avaria: null },
    laudoRetirada: { oleo: true, pneus: true, luzes: true, limpeza: true, kit: true }
  }
];

type Exchange = typeof initialExchanges[0];

export default function VehicleExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>(initialExchanges);
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAprovar = (id: string) => {
    setExchanges(prev => prev.map(ex => ex.id === id ? { ...ex, status: 'Aprovada' } : ex));
    setSelectedExchange(null);
    showToast(`✅ Troca ${id} aprovada e vinculada no sistema!`);
  };

  const handleRecusar = (id: string) => {
    setExchanges(prev => prev.map(ex => ex.id === id ? { ...ex, status: 'Recusada' } : ex));
    setSelectedExchange(null);
    showToast(`❌ Troca ${id} recusada. O motorista deve refazer o checklist.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col relative pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
          {toast}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <ArrowRight className="w-8 h-8 mr-4 text-brand-primary" /> Auditoria de Trocas
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Validação mútua de devolução e entrega de veículos da frota.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-gray-400 uppercase font-black text-[10px] tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-8 py-6">Protocolo</th>
                <th className="px-8 py-6">Motorista</th>
                <th className="px-8 py-6">Operação de Troca</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {exchanges.map((ex) => (
                <tr key={ex.id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                  <td className="px-8 py-6 font-black text-brand-primary text-base">{ex.id}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-xs font-black text-brand-primary border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                        {ex.motorista.charAt(0)}
                      </div>
                      <div>
                          <p className="text-gray-900 font-black text-base">{ex.motorista}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">{ex.data}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-5">
                      <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 text-[11px] font-black shadow-sm flex items-center gap-2 group-hover:shadow-red-200/50 transition-all">
                        <Truck className="w-3 h-3" />
                        {ex.de}
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 animate-pulse" />
                      <div className="bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100 text-[11px] font-black shadow-sm flex items-center gap-2 group-hover:shadow-green-200/50 transition-all">
                        <Truck className="w-3 h-3" />
                        {ex.para}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-inset ${
                      ex.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800 ring-yellow-500/20' : 
                      ex.status === 'Aprovada' ? 'bg-green-100 text-green-800 ring-green-500/20' : 
                      'bg-red-100 text-red-800 ring-red-500/20'
                    }`}>
                      {ex.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setSelectedExchange(ex)}
                      disabled={ex.status !== 'Pendente'}
                      className="bg-brand-primary text-white text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed group-hover:scale-105"
                    >
                      Auditar Troca
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedExchange && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedExchange(null)}></div>
          <div className="relative bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            
            <div className="p-10 border-b bg-gray-900 relative overflow-hidden shrink-0">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-secondary opacity-20 blur-3xl rounded-full" />
                <div className="flex justify-between items-start">
                    <div className="z-10">
                        <span className="text-brand-secondary text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded mb-4 inline-block">Protocolo de Operação Interna</span>
                        <h2 className="text-4xl font-black text-white tracking-tighter">Auditoria de Substituição</h2>
                        <p className="text-gray-400 font-bold uppercase text-xs mt-2 tracking-widest">
                          {selectedExchange.id} • {selectedExchange.motorista}
                        </p>
                    </div>
                    <button onClick={() => setSelectedExchange(null)} className="text-gray-400 hover:text-white p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all z-10 border border-white/10">
                      <X className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-gray-50/50">
              
              <div className="grid grid-cols-2 gap-8">
                {/* COLUNA 1: DEVOLUÇÃO */}
                <div className="space-y-4">
                  <div className="flex items-center text-red-600 font-extrabold uppercase text-[10px] tracking-widest pl-2">
                    <Truck className="w-3.5 h-3.5 mr-3" /> Entrega (Veículo Anterior)
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm space-y-5">
                    <p className="font-black text-gray-900 text-sm border-b border-gray-50 pb-3 leading-tight">{selectedExchange.de}</p>
                    <ul className="space-y-3">
                        <li className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400 italic">Mecânica/Elétrica:</span> 
                          <span className="text-green-600 font-black">✓ CONFORME</span>
                        </li>
                        <li className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400 italic">Rodagem (Pneus):</span> 
                          <span className="text-green-600 font-black">✓ CONFORME</span>
                        </li>
                        <li className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400 italic">Higiene Interna:</span> 
                          <span className="text-red-500 font-black flex items-center bg-red-50 px-2 py-0.5 rounded">⚠ REPROVADO</span>
                        </li>
                    </ul>
                    {selectedExchange.laudoDevolucao.avaria && (
                        <div className="bg-red-50 p-4 rounded-2xl text-[11px] font-bold text-red-700 border border-red-100 flex gap-3 shadow-inner">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" /> 
                          {selectedExchange.laudoDevolucao.avaria}
                        </div>
                    )}
                  </div>
                </div>

                {/* COLUNA 2: RETIRADA */}
                <div className="space-y-4">
                  <div className="flex items-center text-green-700 font-extrabold uppercase text-[10px] tracking-widest pl-2">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-3" /> Recebimento (Novo Ativo)
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-green-100 shadow-sm space-y-5">
                    <p className="font-black text-gray-900 text-sm border-b border-gray-50 pb-3 leading-tight">{selectedExchange.para}</p>
                    <ul className="space-y-3">
                        <li className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400 italic">Filtros/Óleo:</span> 
                          <span className="text-green-600 font-black">✓ CONFORME</span>
                        </li>
                        <li className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400 italic">Pneus:</span> 
                          <span className="text-green-600 font-black">✓ CONFORME</span>
                        </li>
                        <li className="flex justify-between text-[11px] font-bold">
                          <span className="text-gray-400 italic">Kit Emergência:</span> 
                          <span className="text-green-600 font-black">✓ INSTALADO</span>
                        </li>
                    </ul>
                    <div className="bg-green-50 p-4 rounded-2xl text-[11px] font-bold text-green-700 border border-green-100 flex gap-3">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-green-400" /> 
                      Vistoria realizada com sucesso
                    </div>
                  </div>
                </div>
              </div>

               {/* EVIDENCIAS FOTOGRAFICAS */}
               <div>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                    <Camera className="w-5 h-5 mr-3 text-brand-primary" /> Histórico de Evidências (Troca em Campo)
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square bg-white rounded-2xl overflow-hidden border border-gray-200 relative group cursor-pointer shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                        <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Eye className="text-white drop-shadow-md" />
                        </div>
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 p-4 bg-gray-50 group-hover:bg-brand-primary/5 transition-colors">
                          <Camera className="w-6 h-6 mb-2 opacity-20" />
                          <span className="italic text-[10px] font-black uppercase">FOTO {i}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* ASSINATURA */}
               <div className="bg-white p-12 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-secondary opacity-5 blur-3xl rounded-full" />
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-8">Token de Responsabilidade Legal</p>
                  <p className="text-5xl font-serif italic font-black text-gray-800 tracking-tighter decoration-brand-secondary decoration-4 underline underline-offset-[12px]">
                    {selectedExchange.motorista}
                  </p>
                  <div className="mt-12 flex items-center space-x-4 text-[10px] font-black text-brand-primary bg-brand-primary/5 px-6 py-3 rounded-2xl border border-brand-primary/10">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="tracking-widest">DIGITAL IDENTITY VERIFIED ON APP</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-500 uppercase tracking-widest">{selectedExchange.data}</span>
                  </div>
               </div>
              
            </div>

            {/* Ações Fixas no Footer */}
            <div className="p-10 bg-white border-t border-gray-100 flex gap-6 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] shrink-0">
              <button 
                onClick={() => handleRecusar(selectedExchange.id)}
                className="flex-1 py-5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 rounded-[24px] transition-all border border-red-100 uppercase tracking-widest shadow-sm"
              >
                Bloquear Operação
              </button>
              <button 
                onClick={() => handleAprovar(selectedExchange.id)}
                className="flex-[2] py-5 text-xs font-black text-white bg-brand-primary hover:bg-brand-primary/90 hover:-translate-y-1 active:translate-y-0 rounded-[24px] transition-all shadow-2xl shadow-brand-primary/30 uppercase tracking-[0.15em] flex items-center justify-center gap-4"
              >
                <CheckCircle2 className="w-6 h-6 text-brand-secondary" /> 
                Aprovar & Atribuir Ativos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
