"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, MoreVertical, Key, ShieldCheck, Mail, Building, Smartphone, Monitor, X, Check, Globe, LayoutDashboard } from 'lucide-react';

type UserRow = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  tenant_id: string;
  tenants: { nome: string } | null;
};

const perfilLabel: Record<string, string> = {
  motorista: 'Motorista',
  analista: 'Analista de Frota',
  gestor: 'Gestor',
  diretor: 'Diretor',
};

export default function UsersManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Motorista');
  const [acesso, setAcesso] = useState<'app' | 'web' | 'ambos'>('app');

  const loadUsers = useCallback(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => setUsers([]));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreateUser = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      showToast('⚠️ Preencha nome e e-mail.');
      return;
    }
    setLoading(true);
    setIsModalOpen(false);

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, nome: newName, cargo: newRole, acesso }),
    });
    const data = await res.json();

    if (data.error) {
      showToast(`⚠️ ${data.error}`);
    } else {
      showToast(`✅ Acesso criado! Link de definição de senha enviado para ${newEmail}`);
      loadUsers();
    }

    setNewName(''); setNewEmail(''); setNewRole('Motorista'); setAcesso('app');
    setLoading(false);
  };

  const filtered = users.filter(u =>
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative pb-12">
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
          <p className="text-gray-500 mt-2 font-medium">Controle de quem acessa o dashboard e o aplicativo mobile.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl flex items-center font-bold shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 mr-3" />
          Novo Acesso
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-80 group">
            <Search className="w-5 h-5 absolute left-4 top-3 text-gray-400 group-hover:text-brand-primary transition-colors" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-gray-400 uppercase font-black text-[10px] tracking-widest">
              <tr>
                <th className="px-8 py-5">Colaborador</th>
                <th className="px-8 py-5">Empresa</th>
                <th className="px-8 py-5">Perfil</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Controle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhum usuário encontrado</td></tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-brand-primary/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome || u.email)}&background=0056B3&color=fff&bold=true`}
                          alt={u.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-base">{u.nome || '-'}</p>
                        <p className="text-xs text-gray-400 flex items-center font-bold tracking-tight">
                          <Mail className="w-3 h-3 mr-2" /> {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center font-black text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg text-xs border border-gray-200">
                      <Building className="w-3.5 h-3.5 mr-2 text-brand-primary/50" />
                      {u.tenants?.nome ?? u.tenant_id?.slice(0, 8) ?? '-'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="flex items-center font-bold text-gray-800">
                      <ShieldCheck className="w-4 h-4 mr-2 text-brand-primary" />
                      {perfilLabel[u.perfil] ?? u.perfil}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button className="text-gray-400 hover:text-brand-primary p-2.5 rounded-xl hover:bg-brand-primary/10 transition-all" title="Opções">
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

      {/* Modal Criar Acesso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setIsModalOpen(false)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md animate-in slide-in-from-right duration-500 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">

                <div className="bg-gray-50 px-8 py-10 border-b border-gray-100 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Novo Acesso</h2>
                    <p className="text-sm text-gray-500 font-bold mt-1 uppercase tracking-widest opacity-60">O usuário receberá a senha por e-mail</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="rounded-xl bg-white text-gray-400 hover:text-gray-700 p-2 border border-gray-200 shadow-sm transition-all z-10">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex-1 px-8 py-8 space-y-6 overflow-y-auto">

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-gray-900 font-bold"
                      placeholder="Nome do usuário..." />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">E-mail (Login)</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      className="w-full rounded-2xl border border-gray-300 px-5 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-gray-900 font-bold shadow-sm"
                      placeholder="exemplo@empresa.com.br" />
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> O link para definir a senha será enviado automaticamente para este e-mail.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Perfil</label>
                    <select value={newRole} onChange={e => setNewRole(e.target.value)}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-4 outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white font-bold text-gray-900">
                      <option>Motorista</option>
                      <option>Analista de Frota</option>
                      <option>Gestor</option>
                      <option>Diretor</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Acesso à Plataforma</label>
                    <div className="space-y-3">
                      {[
                        { value: 'app', icon: <Smartphone className="w-5 h-5 mr-3 text-brand-primary" />, label: 'App Mobile', desc: 'Checklists, KM e ocorrências.' },
                        { value: 'web', icon: <Monitor className="w-5 h-5 mr-3 text-gray-400" />, label: 'Painel Web', desc: 'Dashboard, relatórios e gestão.' },
                        { value: 'ambos', icon: <Globe className="w-5 h-5 mr-3 text-green-500" />, label: 'App + Painel Web', desc: 'Acesso completo.' },
                      ].map(opt => (
                        <label key={opt.value} className={`flex items-start p-4 border-2 rounded-2xl cursor-pointer transition-colors ${acesso === opt.value ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="acesso" value={opt.value} checked={acesso === opt.value} onChange={() => setAcesso(opt.value as typeof acesso)} className="mt-1 mr-4 text-brand-primary" />
                          <div>
                            <span className="font-black text-gray-900 flex items-center">{opt.icon}{opt.label}</span>
                            <span className="text-xs text-gray-500 mt-1 block">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 px-8 py-6 bg-white flex gap-4 shrink-0">
                  <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all uppercase tracking-widest">
                    Cancelar
                  </button>
                  <button onClick={handleCreateUser} disabled={loading}
                    className="flex-[2] px-8 py-4 text-xs font-black text-white bg-brand-primary rounded-2xl shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all flex items-center justify-center uppercase tracking-widest gap-3 disabled:opacity-50">
                    <Check className="w-5 h-5" />
                    {loading ? 'Criando...' : 'Criar e Enviar por E-mail'}
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
