"use client";

import { AlertTriangle, Tag, Eye, Truck, Wrench, X, CheckCircle, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const recentOccurrences = [
  { placa: 'ABC-1234', motorista: 'Carlos Silva', gravidade: 'Grave', data: 'Hoje, 08:30', badgeClass: 'bg-red-100 text-red-700', status: 'Aberta' },
  { placa: 'XYZ-9876', motorista: 'Roberto Alves', gravidade: 'Média', data: 'Ontem, 19:15', badgeClass: 'bg-yellow-100 text-yellow-700', status: 'Em Tratativa' },
  { placa: 'JKL-4567', motorista: 'Felipe Costa', gravidade: 'Leve', data: '28/03/2026', badgeClass: 'bg-green-100 text-green-700', status: 'Concluída' },
  { placa: 'MNO-5555', motorista: 'Ana Souza', gravidade: 'Média', data: '28/03/2026', badgeClass: 'bg-yellow-100 text-yellow-700', status: 'Aberta' },
];

export default function Dashboard() {
  const [toast, setToast] = useState<string | null>(null);
  const [isNewVehicleOpen, setIsNewVehicleOpen] = useState(false);
  const [newPlaca, setNewPlaca] = useState('');
  const [newModelo, setNewModelo] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleNovoVeiculo = () => {
    if (!newPlaca || !newModelo) {
      showToast('⚠️ Placa e Modelo são obrigatórios.');
      return;
    }
    setIsNewVehicleOpen(false);
    setNewPlaca('');
    setNewModelo('');
    showToast(`✅ Veículo ${newPlaca.toUpperCase()} adicionado! Confira em Gestão da Frota.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-right">
          {toast}
        </div>
      )}

      {/* Modal rápido novo veículo */}
      {isNewVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsNewVehicleOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsNewVehicleOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-1">Novo Veículo</h2>
            <p className="text-gray-500 text-sm mb-6">Cadastro rápido. Acesse Gestão da Frota para mais detalhes.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Placa <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newPlaca}
                  onChange={(e) => setNewPlaca(e.target.value)}
                  placeholder="ex: MNO-3456"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Modelo <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newModelo}
                  onChange={(e) => setNewModelo(e.target.value)}
                  placeholder="ex: Volvo FH 460"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsNewVehicleOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleNovoVeiculo} className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Visão Geral da Frota</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Acompanhe as métricas essenciais da sua operação em tempo real.</p>
        </div>
        <button
          onClick={() => setIsNewVehicleOpen(true)}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all focus:ring-4 focus:ring-brand-primary/20 flex items-center justify-center shadow-brand-primary/30 cursor-pointer shrink-0"
        >
          <Truck className="w-4 h-4 mr-2" />
          Novo Veículo
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total de Veículos</p>
            <h3 className="text-3xl font-bold text-gray-900">142</h3>
            <p className="text-xs text-green-600 mt-2 font-medium flex items-center">
              <span className="bg-green-100 px-1.5 py-0.5 rounded mr-1">+4</span> este mês
            </p>
          </div>
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:scale-110 transition-transform">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Ocorrências Ativas</p>
            <h3 className="text-3xl font-bold text-gray-900">18</h3>
            <p className="text-xs text-red-600 mt-2 font-medium">3 graves não tratadas</p>
          </div>
          <div className="p-3 bg-red-100 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Aguardando Avaliação</p>
            <h3 className="text-3xl font-bold text-gray-900">5</h3>
            <p className="text-xs text-yellow-600 mt-2 font-medium">Orçamentos pendentes</p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600 group-hover:scale-110 transition-transform">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between group hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Em Manutenção</p>
            <h3 className="text-3xl font-bold text-gray-900">11</h3>
            <p className="text-xs text-gray-500 mt-2 font-medium">Nas oficinas credenciadas</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
            <Wrench className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Occurrences Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Últimas Ocorrências Relatadas</h2>
            <a href="/ocorrencias" className="text-sm text-brand-primary font-medium hover:underline cursor-pointer">Ver todas</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-sm">
                  <th className="px-6 py-4 font-medium">Placa</th>
                  <th className="px-6 py-4 font-medium">Motorista</th>
                  <th className="px-6 py-4 font-medium">Gravidade</th>
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOccurrences.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-800">{item.placa}</td>
                    <td className="px-6 py-4 text-gray-600">{item.motorista}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${item.badgeClass}`}>
                        {item.gravidade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{item.data}</td>
                    <td className="px-6 py-4 text-right">
                      <a href="/ocorrencias" className="text-gray-400 hover:text-brand-primary p-2 rounded-lg hover:bg-brand-primary/10 transition-colors inline-flex">
                        <Eye className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Central de Tarefas</h2>
          <div className="space-y-4">
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
              <h4 className="font-bold text-yellow-900 text-sm mb-1">Orçamento Aguardando Aprovação</h4>
              <p className="text-xs text-yellow-800 mb-3">Placa XYZ-9876 (R$ 1.450,00) excedeu teto de analista.</p>
              <button
                onClick={() => showToast('💰 Redirecionando para análise de orçamento...')}
                className="text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Analisar
              </button>
            </div>

            <div
              className="p-4 border border-gray-100 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => showToast('📋 Abrindo auditoria de checklists...')}
            >
              <h4 className="font-bold text-gray-800 text-sm mb-1">Auditoria de Checklists</h4>
              <p className="text-xs text-gray-500">12 checklists diários reportaram ausência de estepe ontem.</p>
            </div>

            <div
              className="p-4 border border-gray-100 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => showToast('⚙️ Redirecionando para configurações do tenant...')}
            >
              <h4 className="font-bold text-gray-800 text-sm mb-1">Configurar Gestão de Frota Segura</h4>
              <p className="text-xs text-gray-500">A nova empresa 'LogisticaPro' ainda não configurou as cores.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
