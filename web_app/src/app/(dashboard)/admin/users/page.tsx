"use client";

import { useState } from 'react';
import { Plus, Search, MoreVertical, Key, ShieldCheck, Mail, Building, Smartphone, Monitor, X, Check, Globe, LayoutDashboard } from 'lucide-react';

export default function UsersManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [users, setUsers] = useState([
    { id: 1, name: 'Roberto Alves', role: 'Motorista', tenant: 'ViaCargas', email: 'roberto@viacargas.com', status: 'Ativo', access: ['App'] },
    { id: 2, name: 'João Gestor', role: 'Gestor de Frotas', tenant: 'ViaCargas', email: 'joao.gestor@viacargas.com', status: 'Ativo', access: ['Web', 'App'] },
    { id: 3, name: 'Ana Souza', role: 'Analista de Frotas', tenant: 'LogisticaPro', email: 'ana.souza@logpro.com', status: 'Inativo', access: ['Web'] },
    { id: 4, name: 'Felipe Costa', role: 'Diretor Operacional', tenant: 'LogisticaPro', email: 'dir.felipe@logpro.com', status: 'Ativo', access: ['Web', 'App'] },
  ]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreateUser = () => {
    setIsModalOpen(false);
    showToast('🚀 Convite enviado com sucesso para o novo usuário!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
          {toast}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-brand-primary" />
            Gestão de Acessos
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Controle rigoroso de quem pode acessar o dashboard e os fluxos do aplicativo mobile.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl flex items-center font-bold shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-3" />
          Novo Acesso
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-80 group">
            <Search className="w-5 h-5 absolute left-4 top-3 text-gray-400 group-hover:text-brand-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all shadow-sm" 
            />
          </div>
          <div className="flex gap-4">
            <select className="border border-gray-300 text-sm rounded-xl px-4 py-3 text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all cursor-pointer">
              <option>Todos os Clientes</option>
              <option>ViaCargas</option>
              <option>LogisticaPro</option>
            </select>
            <select className="border border-gray-300 text-sm rounded-xl px-4 py-3 text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all cursor-pointer">
              <option>Todos os Perfis</option>
              <option>Motorista</option>
              <option>Gestor de Frotas</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-gray-400 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Tenant (Empresa)</th>
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5">Liberação SaaS</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                        <img 
                          src={u.id === 1 
                            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0056B3&color=fff&bold=true`
                          } 
                          alt={u.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-base">{u.name}</p>
                        <p className="text-xs text-gray-400 flex items-center font-bold tracking-tight"><Mail className="w-3 h-3 mr-2" /> {u.email.toUpperCase()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center font-black text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg text-xs border border-gray-200">
                      <Building className="w-3.5 h-3.5 mr-2 text-brand-primary/50" /> {u.tenant.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center font-bold text-gray-800"><ShieldCheck className="w-4 h-4 mr-2 text-brand-primary" /> {u.role}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-2">
                      {u.access.includes('App') && (
                        <span className="px-2.5 py-1 bg-blue-50 text-brand-primary rounded-lg text-[10px] font-black flex items-center shadow-sm border border-blue-100 uppercase" title="Acesso ao App Mobile">
                          <Smartphone className="w-3.5 h-3.5 mr-1"/> Mobile
                        </span>
                      )}
                      {u.access.includes('Web') && (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-black flex items-center shadow-sm border border-gray-200 uppercase" title="Acesso ao Painel Web">
                          <Globe className="w-3.5 h-3.5 mr-1"/> SaaS
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-brand-primary p-2.5 rounded-xl hover:bg-brand-primary/10 transition-all" title="Zerar Senha">
                        <Key className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-900 p-2.5 rounded-xl hover:bg-gray-100 transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over de Criação de Acesso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity opacity-100 animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform transition-transform animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">
                
                <div className="bg-gray-50 px-8 py-10 border-b border-gray-100 flex items-center justify-between relative overflow-hidden shrink-0">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary opacity-10 rounded-full blur-3xl pointer-events-none" />
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight" id="slide-over-title">Convidar Integrante</h2>
                    <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest opacity-60">Habilitação de acessos</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="rounded-xl bg-white text-gray-400 hover:text-gray-700 focus:outline-none p-2 border border-gray-200 shadow-sm transition-all hover:bg-gray-50 z-10">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="relative flex-1 px-8 py-8 space-y-8 flex flex-col justify-start overflow-y-auto">
                  
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Nome e Sobrenome</label>
                    <input type="text" className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-gray-900 font-bold transition-all" placeholder="Nome do usuário..." />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">E-mail Corporativo (Login)</label>
                    <input type="email" className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-gray-900 font-bold transition-all shadow-sm" placeholder="exemplo@empresa.com.br" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Perfil da Conta</label>
                      <select className="w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white font-bold text-gray-900 cursor-pointer">
                        <option>Motorista</option>
                        <option>Analista de Frota</option>
                        <option>Gestor</option>
                        <option>Diretor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Ativos Vinculados</label>
                      <select className="w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white font-bold text-gray-900 cursor-pointer">
                        <option value="">Nenhum</option>
                        <option>Volvo ABC-1234</option>
                        <option>Scania XYZ-9876</option>
                        <option>Carreta DEF-5555</option>
                      </select>
                    </div>
                  </div>

                  {/* Seletores de Liberação Dinâmica */}
                  <div className="pt-8 mt-4 border-t border-gray-100">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Permissionamento de Plataforma</label>
                    
                    <div className="space-y-4">
                      <label className="flex items-start p-5 border-2 border-brand-primary bg-brand-primary/5 rounded-2xl cursor-pointer hover:bg-brand-primary/10 transition-colors shadow-sm shadow-brand-primary/10">
                        <div className="flex items-center h-6 mt-0.5">
                          <input type="checkbox" defaultChecked className="w-5 h-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer" />
                        </div>
                        <div className="ml-4 flex flex-col">
                          <span className="text-lg font-black text-gray-900 flex items-center leading-none">
                            <Smartphone className="w-5 h-5 mr-3 text-brand-primary" /> App Mobile Motorista
                          </span>
                          <span className="text-sm text-gray-500 mt-2 leading-relaxed font-medium italic opacity-70">Lançamento de KM, checklists diários e registros de fotos de avarias.</span>
                        </div>
                      </label>
                      
                      <label className="flex items-start p-5 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center h-6 mt-0.5">
                          <input type="checkbox" className="w-5 h-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer" />
                        </div>
                        <div className="ml-4 flex flex-col">
                          <span className="text-lg font-black text-gray-900 flex items-center leading-none">
                            <Monitor className="w-5 h-5 mr-3 text-gray-400" /> Painel de Gestão SaaS
                          </span>
                          <span className="text-sm text-gray-500 mt-2 leading-relaxed font-medium italic opacity-70">Acesso administrativo para auditoria, relatórios e gestão de recursos.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                </div>

                {/* Footer Actions */}
                <div className="border-t border-gray-100 px-8 py-6 bg-white flex justify-end gap-4 shadow-[0_-15px_35px_-5px_rgba(0,0,0,0.05)] shrink-0">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button onClick={handleCreateUser} className="flex-[2] px-8 py-4 text-xs font-black text-white bg-brand-primary border border-transparent rounded-2xl shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center uppercase tracking-widest gap-3">
                    <Check className="w-5 h-5" /> 
                    Criar Cadastro e Notificar
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
