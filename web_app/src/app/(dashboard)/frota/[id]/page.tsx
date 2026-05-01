"use client";

import { useState, useEffect, use } from 'react';
import { 
  Truck, Calendar, MapPin, Activity, FileText, ClipboardList, 
  ChevronLeft, Loader2, AlertCircle, CheckCircle2, 
  ExternalLink, User, Fuel, Gauge, Hash, Box
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
  tipo: string;
  data_vencimento: string | null;
  url_anexo: string | null;
  observacao: string | null;
};

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

        // Busca documentos
        const resD = await fetch(`/api/admin/frota/documentos?veiculo_id=${id}`);
        const dataD = await resD.json();
        setDocuments(dataD.documentos ?? []);

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
              {documents.length === 0 ? (
                <EmptyState icon={FileText} message="Nenhum documento encontrado." />
              ) : (
                <div className="grid gap-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100/50 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{doc.tipo}</p>
                          <p className="text-xs text-gray-500">
                            {doc.data_vencimento 
                              ? `Vencimento: ${new Date(doc.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}`
                              : 'Sem data de vencimento'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.url_anexo && (
                          <a 
                            href={doc.url_anexo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary/20 transition-all"
                            title="Ver documento"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${
                          doc.data_vencimento && new Date(doc.data_vencimento) < new Date()
                            ? 'bg-red-100 text-red-600 border-red-200'
                            : 'bg-green-100 text-green-600 border-green-200'
                        }`}>
                          {doc.data_vencimento && new Date(doc.data_vencimento) < new Date() ? 'VENCIDO' : 'VÁLIDO'}
                        </span>
                      </div>
                    </div>
                  ))}
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
