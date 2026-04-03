"use client";

import { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle2, Clock, Car, User, Camera, ClipboardCheck, X, FileSignature, ThermometerSun, AlertOctagon, Lightbulb } from 'lucide-react';

const initialInspections = [
  { 
    id: 'CK-1049', motorista: 'Roberto Alves', placa: 'ABC-1234', data: 'Hoje, 07:15', status: 'Aprovado', km: '154.200', 
    mec: { oleo: true, pneus: true, luzes: true, freios: true } 
  },
  { 
    id: 'CK-1050', motorista: 'João Silva', placa: 'XYZ-9876', data: 'Hoje, 08:30', status: 'Pendente', km: '98.500', 
    mec: { oleo: true, pneus: false, luzes: true, freios: true } 
  },
  { 
    id: 'CK-1051', motorista: 'Carlos Santos', placa: 'DEF-5555', data: 'Ontem, 19:45', status: 'Avaria Grave', km: '210.100', 
    mec: { oleo: false, pneus: true, luzes: false, freios: true } 
  },
];

type Inspection = typeof initialInspections[0];

export default function ChecklistsPage() {
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAprovar = (id: string) => {
    setInspections(prev => prev.map(insp => insp.id === id ? { ...insp, status: 'Aprovado' } : insp));
    setSelectedInspection(null);
    showToast(`✅ Inspeção ${id} aprovada com sucesso!`);
  };

  const handleRecusar = (id: string) => {
    setInspections(prev => prev.map(insp => insp.id === id ? { ...insp, status: 'Avaria Grave' } : insp));
    setSelectedInspection(null);
    showToast(`❌ Inspeção ${id} recusada. Veículo bloqueado para saída.`);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Aprovado': return <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold flex items-center w-fit shadow-sm border border-green-200"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Liberado</span>;
      case 'Pendente': return <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-bold flex items-center w-fit shadow-sm border border-yellow-200"><Clock className="w-3.5 h-3.5 mr-1" /> Em Revisão</span>;
      case 'Avaria Grave': return <span className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full font-bold flex items-center w-fit shadow-sm border border-red-200"><AlertTriangle className="w-3.5 h-3.5 mr-1" /> Risco (Recusado)</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-3 py-1 rounded-full font-bold w-fit border border-gray-200">{status}</span>;
    }
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <ClipboardCheck className="w-8 h-8 mr-3 text-brand-primary" /> 
            Central de Inspeções Diárias
          </h1>
          <p className="text-gray-500 mt-2">Validação e liberação dos checklists operacionais recebidos pelo App do Motorista.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => showToast('🔍 Filtros de placas em desenvolvimento.')}
            className="group bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl flex items-center font-bold shadow-sm hover:border-brand-primary/50 hover:text-brand-primary transition-all cursor-pointer"
          >
            <Filter className="w-4 h-4 mr-2 text-gray-400 group-hover:text-brand-primary" />
            Filtrar Ativos
          </button>
        </div>
      </div>

      {/* Grid de Checklists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {inspections.map((insp) => (
          <div 
            key={insp.id} 
            onClick={() => setSelectedInspection(insp)} 
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
                <span className="block text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-1">Conformidade</span>
                <span className={`font-black text-sm ${insp.status === 'Aprovado' ? 'text-green-600' : 'text-red-600'}`}>
                  {insp.status === 'Aprovado' ? '100% OK' : (insp.status === 'Pendente' ? '1 ALERTA' : 'AVARIADO')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over de Auditoria */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity opacity-100 animate-in fade-in" onClick={() => setSelectedInspection(null)}></div>
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-xl transform transition-transform animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">
                
                {/* Header Customizado */}
                <div className="bg-gray-900 px-8 py-10 flex items-center justify-between relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary opacity-20 blur-3xl rounded-bl-full pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
                  <div className="z-10">
                    <span className="bg-brand-secondary text-brand-primary text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-2 inline-block">Módulo de Auditoria</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter flex items-center">
                      {selectedInspection.id}
                    </h2>
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
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Condutor Reportado</p>
                      <p className="font-black text-gray-900 flex items-center text-lg"><User className="w-5 h-5 mr-3 text-brand-primary/50" /> {selectedInspection.motorista}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Odômetro Atual</p>
                      <p className="font-black text-gray-900 text-2xl flex items-center text-brand-primary tracking-tighter">
                        {selectedInspection.km} <span className="text-xs ml-1 text-gray-400 uppercase">km</span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-wider flex items-center">
                      <AlertOctagon className="w-5 h-5 mr-3 text-red-500" /> 
                      Itens de Segurança Crítica
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'Nível do Óleo do Motor', state: selectedInspection.mec.oleo, icon: ThermometerSun },
                        { label: 'Estado e Calibragem Pneus', state: selectedInspection.mec.pneus, icon: Car },
                        { label: 'Luzes de Alerta / Freio', state: selectedInspection.mec.luzes, icon: Lightbulb },
                        { label: 'Sistema de Frenagem', state: selectedInspection.mec.freios, icon: AlertTriangle },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                          <span className="text-sm font-bold text-gray-700 flex items-center italic">
                            <item.icon className="w-4 h-4 mr-3 text-gray-300" /> {item.label}
                          </span>
                          {item.state ? (
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase border border-green-200">Em Conformidade</span>
                          ) : (
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg font-black text-[10px] uppercase border border-red-200 animate-pulse">Avaria Reportada</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-gray-900 mb-6 uppercase tracking-wider flex items-center">
                      <Camera className="w-5 h-5 mr-3 text-brand-primary" /> 
                      Evidências Fotográficas (APP)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden relative border-2 border-gray-200 group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/10 group-hover:bg-gray-800/20 transition-all">
                          <Car className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-3">
                          <p className="text-white text-[10px] font-black text-center uppercase tracking-widest">Dianteira Geral</p>
                        </div>
                      </div>
                      <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden relative border-2 border-gray-200 group cursor-pointer">
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/10 group-hover:bg-gray-800/20 transition-all">
                          <AlertOctagon className="w-16 h-16 text-gray-400 group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-3">
                          <p className="text-white text-[10px] font-black text-center uppercase tracking-widest">Foco da Avaria</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
                    <FileSignature className="w-10 h-10 text-gray-300 mb-4" />
                    <p className="text-4xl font-serif italic font-black text-gray-800 decoration-brand-secondary decoration-2 underline underline-offset-8">
                      {selectedInspection.motorista}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-6">Assinatura Digital Auditada via Fingerprint</p>
                  </div>
                  
                </div>

                {/* Ações Fixas no Footer */}
                <div className="border-t border-gray-200 px-8 py-6 bg-white flex justify-end gap-4 shadow-[0_-15px_35px_-5px_rgba(0,0,0,0.05)] shrink-0">
                  <button 
                    onClick={() => handleRecusar(selectedInspection.id)} 
                    className="px-6 py-4 text-xs font-black text-red-700 bg-red-50 hover:bg-red-100 rounded-2xl transition-all mr-auto uppercase tracking-widest border border-red-100"
                  >
                    Recusar Checklist
                  </button>
                  <button 
                    onClick={() => handleAprovar(selectedInspection.id)} 
                    className="px-10 py-4 text-xs font-black text-white bg-green-600 border border-transparent rounded-2xl shadow-xl shadow-green-600/20 hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center uppercase tracking-widest"
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
