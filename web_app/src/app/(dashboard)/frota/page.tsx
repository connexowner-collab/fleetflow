"use client";

import { useState, useEffect } from 'react';
import { Truck, Users, Activity, Wrench, MoreVertical, Search, Plus, Filter, X, CheckCircle, Eye } from 'lucide-react';

const statusStyles: Record<string, string> = {
  'Em Rota': 'bg-blue-100 text-blue-700 border-blue-200',
  'Disponível': 'bg-green-100 text-green-700 border-green-200',
  'Em Manutenção': 'bg-orange-100 text-orange-700 border-orange-200',
  'Sinistrado': 'bg-red-100 text-red-700 border-red-200',
};

type Vehicle = {
  id: string | number;
  placa: string;
  modelo: string;
  motorista: string;
  status: string;
  km: string;
  carga: string;
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Novo veículo
  const [newPlaca, setNewPlaca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newMotorista, setNewMotorista] = useState('');
  const [newCarga, setNewCarga] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/admin/frota');
      const json = await res.json();
      setVehicles(
        (json.veiculos || []).map((v: { id: string; placa: string; modelo: string; profiles?: { nome?: string } | null; status: string; km_atual?: number; capacidade?: string }) => ({
          id: v.id,
          placa: v.placa,
          modelo: v.modelo,
          motorista: v.profiles?.nome ?? 'Nenhum',
          status: v.status,
          km: v.km_atual?.toLocaleString('pt-BR') ?? '0',
          carga: v.capacidade ?? 'N/A',
        }))
      );
    } catch {
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const filtered = vehicles.filter(
    (v) =>
      v.placa.toLowerCase().includes(search.toLowerCase()) ||
      v.motorista.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase())
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCadastrar = async () => {
    if (!newPlaca || !newModelo) {
      showToast('⚠️ Placa e Modelo são obrigatórios.');
      return;
    }
    try {
      const res = await fetch('/api/admin/frota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa: newPlaca, modelo: newModelo, capacidade: newCarga }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      await fetchVehicles();
      setIsModalOpen(false);
      setNewPlaca(''); setNewModelo(''); setNewMotorista(''); setNewCarga('');
      showToast('✅ Veículo cadastrado com sucesso!');
    } catch {
      showToast('⚠️ Erro ao cadastrar veículo.');
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

      {/* Modal Detalhe Veículo */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSelectedVehicle(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedVehicle(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center mb-6">
              <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center mr-4">
                <Truck className="w-8 h-8 text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{selectedVehicle.placa}</h2>
                <p className="text-gray-500 text-sm">{selectedVehicle.modelo}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Motorista', value: selectedVehicle.motorista },
                { label: 'KM Atual', value: `${selectedVehicle.km} KM` },
                { label: 'Capacidade', value: selectedVehicle.carga },
                { label: 'Status', value: selectedVehicle.status },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">{item.label}</span>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { showToast('📋 Histórico de manutenções em desenvolvimento.'); setSelectedVehicle(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Ver Histórico
              </button>
              <button
                onClick={() => { showToast('✏️ Edição de veículo em desenvolvimento.'); setSelectedVehicle(null); }}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 transition-colors"
              >
                Editar Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h2 className="text-xl font-black text-gray-900 mb-1">Cadastrar Veículo</h2>
            <p className="text-gray-500 text-sm mb-6">Preencha os dados para adicionar à frota.</p>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Motorista</label>
                <input
                  type="text"
                  value={newMotorista}
                  onChange={(e) => setNewMotorista(e.target.value)}
                  placeholder="ex: João Pereira"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Capacidade de Carga</label>
                <input
                  type="text"
                  value={newCarga}
                  onChange={(e) => setNewCarga(e.target.value)}
                  placeholder="ex: 40t"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleCadastrar} className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-brand-primary/90 shadow-sm transition-colors flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Truck className="w-8 h-8 mr-3 text-brand-primary" />
            Gestão da Frota
          </h1>
          <p className="text-gray-500 mt-1">Monitore e gerencie todos os ativos da sua operação.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-brand-primary/20 flex items-center transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Cadastrar Veículo
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Frotas', value: vehicles.length.toString(), icon: Truck, color: 'text-brand-primary' },
          { label: 'Em Viagem', value: vehicles.filter(v => v.status === 'Em Rota').length.toString(), icon: Activity, color: 'text-blue-600' },
          { label: 'Na Oficina', value: vehicles.filter(v => v.status === 'Em Manutenção').length.toString(), icon: Wrench, color: 'text-orange-600' },
          { label: 'Disponíveis', value: vehicles.filter(v => v.status === 'Disponível').length.toString(), icon: Users, color: 'text-green-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className={`p-3 bg-gray-50 rounded-xl ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa, modelo ou motorista..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-brand-primary outline-none transition-all text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => showToast('🔧 Filtros avançados em desenvolvimento.')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Filtrar"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum veículo encontrado para "{search}"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-xs font-black uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4 font-black">Informação do Veículo</th>
                  <th className="px-6 py-4 font-black">Motorista</th>
                  <th className="px-6 py-4 font-black">KM Atual</th>
                  <th className="px-6 py-4 font-black text-center">Status</th>
                  <th className="px-6 py-4 font-black text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-brand-primary/5 rounded-lg flex items-center justify-center mr-3">
                          <Truck className="w-6 h-6 text-brand-primary/60" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 leading-none mb-1">{v.placa}</p>
                          <p className="text-xs text-gray-500 font-medium">{v.modelo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-[10px] font-bold text-gray-600">
                          {v.motorista.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-gray-700">{v.motorista}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900">{v.km} KM</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Capacidade {v.carga}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${statusStyles[v.status]}`}>
                        {v.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedVehicle(v)}
                          className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => showToast(`📋 Mais opções para ${v.placa} em desenvolvimento.`)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Mais opções"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
