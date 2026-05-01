"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, ShieldCheck, Mail, Building, Smartphone, Monitor,
  X, Check, Globe, LayoutDashboard, Pencil, Trash2, Power, Truck,
  KeyRound, History, Filter, Eye,
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────────────────────

type Veiculo = { id: string; placa: string; modelo: string; status: string };

type UserRow = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  telas_permitidas: string[];
  veiculo_id: string | null;
  tenant_id: string;
  acesso: string;
  telefone: string | null;
  filial: string | null;
  created_at: string;
  tenants: { nome: string } | null;
  veiculos: { id: string; placa: string; modelo: string } | null;
};

type AuditLog = {
  id: string;
  created_at: string;
  ator_email: string;
  ator_perfil: string;
  acao: string;
  usuario_afetado_email: string | null;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  ip: string | null;
  ambiente: string;
};

// ── Constantes ───────────────────────────────────────────────────────────────

const perfilLabel: Record<string, string> = {
  motorista: 'Motorista',
  analista: 'Analista de Frota',
  gestor: 'Gestor',
  diretor: 'Diretor',
};

const acessoLabel: Record<string, string> = {
  app: 'App Mobile',
  web: 'Painel Web',
  ambos: 'App + Painel',
};

const TELAS = [
  { id: 'checklist', label: 'Checklist Diário', desc: 'Inspeção padrão de rotina', icon: '📋' },
  { id: 'troca', label: 'Troca de Veículo', desc: 'Devolução e retirada', icon: '🔄' },
  { id: 'ocorrencia', label: 'Reportar Ocorrência', desc: 'Manutenção ou avarias', icon: '⚠️' },
  { id: 'historico', label: 'Meu Histórico', desc: 'Consultar laudos passados', icon: '📜' },
];

const ACOES_LABEL: Record<string, string> = {
  USER_CREATED: 'Criação',
  USER_EDITED: 'Edição',
  USER_ACTIVATED: 'Ativação',
  USER_DEACTIVATED: 'Desativação',
  USER_DELETED: 'Exclusão',
  PASSWORD_RESET: 'Reset de Senha',
  VEHICLE_LINKED: 'Vínculo de Veículo',
  VEHICLE_UNLINKED: 'Desvinculação de Veículo',
  PERMISSIONS_CHANGED: 'Alteração de Permissões',
};

const ACOES_COLOR: Record<string, string> = {
  USER_CREATED: 'bg-green-100 text-green-700',
  USER_EDITED: 'bg-blue-100 text-blue-700',
  USER_ACTIVATED: 'bg-emerald-100 text-emerald-700',
  USER_DEACTIVATED: 'bg-orange-100 text-orange-700',
  USER_DELETED: 'bg-red-100 text-red-700',
  PASSWORD_RESET: 'bg-purple-100 text-purple-700',
  VEHICLE_LINKED: 'bg-cyan-100 text-cyan-700',
  VEHICLE_UNLINKED: 'bg-gray-100 text-gray-700',
  PERMISSIONS_CHANGED: 'bg-yellow-100 text-yellow-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function veiculoLabel(v: Veiculo) {
  return `${v.modelo} (${v.placa})`;
}

function toggleTela(tela: string, list: string[], setList: (v: string[]) => void) {
  setList(list.includes(tela) ? list.filter(t => t !== tela) : [...list, tela]);
}

// ── Sub-componentes (module scope) ───────────────────────────────────────────

const VeiculoSelect = ({ value, onChange, veiculos }: { value: string; onChange: (v: string) => void; veiculos: Veiculo[] }) => (
  <div>
    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
      <Truck className="w-3.5 h-3.5" /> Veículo Vinculado <span className="text-gray-300">(opcional)</span>
    </label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white font-bold text-gray-900">
      <option value="">— Nenhum veículo vinculado —</option>
      {veiculos.map(v => (
        <option key={v.id} value={v.id}>
          {veiculoLabel(v)} {v.status !== 'Disponível' ? `· ${v.status}` : ''}
        </option>
      ))}
    </select>
  </div>
);

const TelasList = ({ list, setList }: { list: string[]; setList: (v: string[]) => void }) => (
  <div>
    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Telas Visíveis no App</label>
    <div className="space-y-2">
      {TELAS.map(t => (
        <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${list.includes(t.id) ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}>
          <input type="checkbox" checked={list.includes(t.id)} onChange={() => toggleTela(t.id, list, setList)} className="w-4 h-4 text-brand-primary rounded" />
          <span className="text-lg">{t.icon}</span>
          <div>
            <span className="font-black text-gray-900 text-sm">{t.label}</span>
            <span className="block text-xs text-gray-400">{t.desc}</span>
          </div>
        </label>
      ))}
    </div>
  </div>
);

// ── Componente Principal ─────────────────────────────────────────────────────

export default function UsersManagement() {
  // ── Tab ──
  const [activeTab, setActiveTab] = useState<'usuarios' | 'historico'>('usuarios');

  // ── Dados ──
  const [users, setUsers] = useState<UserRow[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Filtros por coluna (G2.1) ──
  const [fNome, setFNome] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPerfil, setFPerfil] = useState('');
  const [fFilial, setFFilial] = useState('');
  const [fStatus, setFStatus] = useState('');

  // ── Modais ──
  const [modalCriar, setModalCriar] = useState(false);
  const [modalEditar, setModalEditar] = useState<UserRow | null>(null);
  const [modalDeletar, setModalDeletar] = useState<UserRow | null>(null);
  const [modalReset, setModalReset] = useState<UserRow | null>(null);
  const [logDetail, setLogDetail] = useState<AuditLog | null>(null);

  // ── Form criar ──
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newTelefone, setNewTelefone] = useState('');
  const [newFilial, setNewFilial] = useState('');
  const [newRole, setNewRole] = useState('Motorista');
  const [newAcesso, setNewAcesso] = useState('app');
  const [newTelas, setNewTelas] = useState<string[]>(['checklist', 'troca', 'ocorrencia', 'historico']);
  const [newVeiculoId, setNewVeiculoId] = useState('');

  // ── Form editar ──
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editFilial, setEditFilial] = useState('');
  const [editRole, setEditRole] = useState('Motorista');
  const [editAcesso, setEditAcesso] = useState('app');
  const [editTelas, setEditTelas] = useState<string[]>([]);
  const [editVeiculoId, setEditVeiculoId] = useState('');

  // ── Audit Log ──
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [afDataInicio, setAfDataInicio] = useState('');
  const [afDataFim, setAfDataFim] = useState('');
  const [afAtor, setAfAtor] = useState('');
  const [afAcao, setAfAcao] = useState('');
  const [afUsuario, setAfUsuario] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Fetch usuarios ──
  const loadUsers = useCallback(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(d => setUsers(d.users || []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    loadUsers();
    fetch('/api/admin/veiculos')
      .then(r => r.json())
      .then(d => setVeiculos(d.veiculos || []))
      .catch(() => {});
  }, [loadUsers]);

  // ── Fetch audit log ──
  const loadAuditLogs = useCallback(() => {
    setAuditLoading(true);
    const params = new URLSearchParams({ page: String(auditPage) });
    if (afDataInicio) params.set('data_inicio', afDataInicio);
    if (afDataFim) params.set('data_fim', afDataFim);
    if (afAtor) params.set('ator_email', afAtor);
    if (afAcao) params.set('acao', afAcao);
    if (afUsuario) params.set('usuario_afetado', afUsuario);

    fetch(`/api/admin/users/audit-log?${params}`)
      .then(r => r.json())
      .then(d => { setAuditLogs(d.logs ?? []); setAuditTotal(d.total ?? 0); })
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false));
  }, [auditPage, afDataInicio, afDataFim, afAtor, afAcao, afUsuario]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (activeTab === 'historico') loadAuditLogs();
  }, [activeTab, loadAuditLogs]);

  // ── Filtro client-side (G2.1) ──
  const filtered = users.filter(u => {
    if (fNome && !u.nome?.toLowerCase().includes(fNome.toLowerCase()) && !u.email?.toLowerCase().includes(fNome.toLowerCase())) return false;
    if (fEmail && !u.email?.toLowerCase().includes(fEmail.toLowerCase())) return false;
    if (fPerfil && (perfilLabel[u.perfil] ?? u.perfil) !== fPerfil) return false;
    if (fFilial && (u.filial ?? '').toLowerCase() !== fFilial.toLowerCase()) return false;
    if (fStatus === 'ativo' && !u.ativo) return false;
    if (fStatus === 'inativo' && u.ativo) return false;
    return true;
  });

  const hasFilters = fNome || fEmail || fPerfil || fFilial || fStatus;
  const clearFilters = () => { setFNome(''); setFEmail(''); setFPerfil(''); setFFilial(''); setFStatus(''); };

  // Unique filiais from loaded users (for datalist autocomplete)
  const filiaisDisponiveis = [...new Set(users.map(u => u.filial).filter(Boolean))] as string[];

  // ── CRUD ──
  const handleCriar = async () => {
    if (!newName.trim() || !newEmail.trim() || !newTelefone.trim() || !newFilial.trim()) {
      showToast('⚠️ Preencha todos os campos obrigatórios.', 'error'); return;
    }
    setLoading(true); setModalCriar(false);
    const veiculo = veiculos.find(v => v.id === newVeiculoId);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail, nome: newName, cargo: newRole,
        acesso: newAcesso, telas: newTelas,
        veiculo_id: newVeiculoId || null,
        placa: veiculo?.placa || null,
        telefone: newTelefone,
        filial: newFilial,
      }),
    });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : `✅ Convite enviado para ${newEmail}`, data.error ? 'error' : 'success');
    if (!data.error) loadUsers();
    setNewName(''); setNewEmail(''); setNewTelefone(''); setNewFilial('');
    setNewRole('Motorista'); setNewAcesso('app');
    setNewTelas(['checklist', 'troca', 'ocorrencia', 'historico']); setNewVeiculoId('');
    setLoading(false);
  };

  const openEditar = (u: UserRow) => {
    setEditNome(u.nome);
    setEditTelefone(u.telefone ?? '');
    setEditFilial(u.filial ?? '');
    setEditRole(perfilLabel[u.perfil] ?? 'Motorista');
    setEditAcesso(u.acesso ?? 'app');
    setEditTelas(u.telas_permitidas ?? ['checklist', 'troca', 'ocorrencia', 'historico']);
    setEditVeiculoId(u.veiculo_id ?? '');
    setModalEditar(u);
  };

  const handleEditar = async () => {
    if (!modalEditar) return;
    setLoading(true); setModalEditar(null);
    const veiculo = veiculos.find(v => v.id === editVeiculoId);
    const res = await fetch(`/api/admin/users/${modalEditar.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: editNome, cargo: editRole,
        acesso: editAcesso,
        telas_permitidas: editTelas,
        veiculo_id: editVeiculoId || null,
        placa: veiculo?.placa || null,
        telefone: editTelefone,
        filial: editFilial,
      }),
    });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : '✅ Usuário atualizado!', data.error ? 'error' : 'success');
    if (!data.error) loadUsers();
    setLoading(false);
  };

  const handleToggleStatus = async (u: UserRow) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : `${!u.ativo ? '✅ Usuário ativado' : '🔴 Usuário desativado'}`, data.error ? 'error' : 'success');
    if (!data.error) loadUsers();
  };

  const handleDeletar = async () => {
    if (!modalDeletar) return;
    setLoading(true); setModalDeletar(null);
    const res = await fetch(`/api/admin/users/${modalDeletar.id}`, { method: 'DELETE' });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : '🗑️ Usuário excluído.', data.error ? 'error' : 'success');
    if (!data.error) loadUsers();
    setLoading(false);
  };

  const handleResetSenha = async () => {
    if (!modalReset) return;
    setLoading(true); setModalReset(null);
    const res = await fetch(`/api/admin/users/${modalReset.id}/reset-password`, { method: 'PATCH' });
    const data = await res.json();
    showToast(data.error ? `⚠️ ${data.error}` : `✅ Nova senha enviada para ${modalReset.email}`, data.error ? 'error' : 'success');
    setLoading(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto relative pb-12">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-right flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-900 text-white' : 'bg-gray-900 text-white'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'error' ? 'bg-red-400' : 'bg-green-400'}`} /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-brand-primary" /> Gestão de Acessos
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Controle quem acessa o dashboard e o aplicativo mobile.</p>
        </div>
        <button onClick={() => setModalCriar(true)} disabled={loading}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl flex items-center font-bold shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50">
          <Plus className="w-5 h-5 mr-2" /> Novo Acesso
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'usuarios' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Usuários {users.length > 0 && <span className="ml-1 bg-brand-primary/10 text-brand-primary text-xs px-1.5 py-0.5 rounded-full">{users.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'historico' ? 'bg-white text-brand-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <History className="w-4 h-4" /> Histórico de Ações
        </button>
      </div>

      {/* ── ABA USUÁRIOS ── */}
      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Filtros por coluna (G2.1) */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-widest">
                <Filter className="w-3.5 h-3.5" /> Filtros
              </div>
              <input
                value={fNome} onChange={e => setFNome(e.target.value)}
                placeholder="Nome ou e-mail..."
                className="pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 w-44"
              />
              <select value={fPerfil} onChange={e => setFPerfil(e.target.value)}
                className="pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white">
                <option value="">Perfil</option>
                {Object.values(perfilLabel).map(l => <option key={l}>{l}</option>)}
              </select>
              <div className="relative">
                <input
                  list="filiais-list"
                  value={fFilial} onChange={e => setFFilial(e.target.value)}
                  placeholder="Filial..."
                  className="pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 w-36"
                />
                <datalist id="filiais-list">
                  {filiaisDisponiveis.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
              <select value={fStatus} onChange={e => setFStatus(e.target.value)}
                className="pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white">
                <option value="">Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-bold px-2 py-2">
                  <X className="w-3.5 h-3.5" /> Limpar
                </button>
              )}
              <span className="text-xs text-gray-400 ml-auto">{filtered.length} de {users.length} usuário(s)</span>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/70 text-gray-400 uppercase font-black text-[10px] tracking-widest">
                <tr>
                  <th className="px-5 py-4">Colaborador</th>
                  <th className="px-5 py-4">Telefone</th>
                  <th className="px-5 py-4">Filial</th>
                  <th className="px-5 py-4">Perfil</th>
                  <th className="px-5 py-4">Veículo</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">Nenhum usuário encontrado</td></tr>
                )}
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.nome || u.email)}&background=0056B3&color=fff&bold=true`}
                          alt="" className="w-9 h-9 rounded-xl object-cover border-2 border-white shadow shrink-0" />
                        <div>
                          <p className="font-black text-gray-900 text-sm">{u.nome || '-'}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{u.telefone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-4">
                      {u.filial ? (
                        <span className="flex items-center gap-1.5 font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg text-xs border border-gray-200">
                          <Building className="w-3 h-3 text-brand-primary/50" />{u.filial}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                        <ShieldCheck className="w-4 h-4 text-brand-primary" />{perfilLabel[u.perfil] ?? u.perfil}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.veiculos ? (
                        <span className="flex items-center gap-1.5 font-bold text-gray-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs border border-blue-100">
                          <Truck className="w-3 h-3 text-brand-primary" />
                          {u.veiculos.modelo} · {u.veiculos.placa}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => handleToggleStatus(u)}
                        className={`flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 ${u.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                        <Power className="w-3 h-3" />{u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        <button onClick={() => openEditar(u)} title="Editar"
                          className="p-2 rounded-xl text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setModalReset(u)} title="Reset de Senha"
                          className="p-2 rounded-xl text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-all">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button onClick={() => setModalDeletar(u)} title="Excluir"
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ABA HISTÓRICO ── */}
      {activeTab === 'historico' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Filtros de auditoria */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data início</label>
              <input type="date" value={afDataInicio} onChange={e => setAfDataInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Data fim</label>
              <input type="date" value={afDataFim} onChange={e => setAfDataFim(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Ator</label>
              <input value={afAtor} onChange={e => setAfAtor(e.target.value)} placeholder="E-mail do ator..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 w-44" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipo de evento</label>
              <select value={afAcao} onChange={e => setAfAcao(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white">
                <option value="">Todos</option>
                {Object.entries(ACOES_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Usuário afetado</label>
              <input value={afUsuario} onChange={e => setAfUsuario(e.target.value)} placeholder="E-mail..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/30 w-44" />
            </div>
            <button onClick={() => { setAuditPage(1); loadAuditLogs(); }}
              className="px-5 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary/90">
              Filtrar
            </button>
            {(afDataInicio || afDataFim || afAtor || afAcao || afUsuario) && (
              <button onClick={() => { setAfDataInicio(''); setAfDataFim(''); setAfAtor(''); setAfAcao(''); setAfUsuario(''); }}
                className="px-4 py-2 text-xs text-red-500 hover:text-red-700 font-bold">
                <X className="w-3.5 h-3.5 inline mr-1" />Limpar
              </button>
            )}
            <span className="text-xs text-gray-400 ml-auto">{auditTotal} registro(s)</span>
          </div>

          {/* Log table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 text-gray-400 uppercase font-black text-[10px] tracking-widest">
                <tr>
                  <th className="px-5 py-4">Data/Hora</th>
                  <th className="px-5 py-4">Ator</th>
                  <th className="px-5 py-4">Evento</th>
                  <th className="px-5 py-4">Usuário Afetado</th>
                  <th className="px-5 py-4">Ambiente</th>
                  <th className="px-5 py-4 text-right">Detalhe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLoading && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando...</td></tr>
                )}
                {!auditLoading && auditLogs.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum registro encontrado</td></tr>
                )}
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-gray-800">{log.ator_email}</p>
                      <p className="text-xs text-gray-400 capitalize">{log.ator_perfil}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide ${ACOES_COLOR[log.acao] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ACOES_LABEL[log.acao] ?? log.acao}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{log.usuario_afetado_email ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">{log.ambiente}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {(log.dados_antes || log.dados_depois) && (
                        <button onClick={() => setLogDetail(log)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {auditTotal > 50 && (
            <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-400">Página {auditPage} de {Math.ceil(auditTotal / 50)}</span>
              <div className="flex gap-2">
                <button disabled={auditPage <= 1} onClick={() => setAuditPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
                <button disabled={auditPage * 50 >= auditTotal} onClick={() => setAuditPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CRIAR ── */}
      {modalCriar && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModalCriar(false)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-lg animate-in slide-in-from-right duration-300 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Novo Acesso</h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Credenciais enviadas por e-mail</p>
                  </div>
                  <button onClick={() => setModalCriar(false)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 px-8 py-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome Completo *</label>
                      <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                        placeholder="Nome do usuário..." />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">E-mail (Login) *</label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                        placeholder="email@empresa.com.br" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Telefone *</label>
                      <input type="tel" value={newTelefone} onChange={e => setNewTelefone(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                        placeholder="(11) 99999-9999" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Filial *</label>
                      <input list="filiais-criar" type="text" value={newFilial} onChange={e => setNewFilial(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                        placeholder="Matriz..." />
                      <datalist id="filiais-criar">
                        {filiaisDisponiveis.map(f => <option key={f} value={f} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Perfil *</label>
                      <select value={newRole} onChange={e => setNewRole(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                        <option>Motorista</option><option>Analista de Frota</option><option>Gestor</option><option>Diretor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Plataforma *</label>
                      <select value={newAcesso} onChange={e => setNewAcesso(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                        <option value="app">App Mobile</option>
                        <option value="web">Painel Web</option>
                        <option value="ambos">App + Painel Web</option>
                      </select>
                    </div>
                  </div>
                  <VeiculoSelect value={newVeiculoId} onChange={setNewVeiculoId} veiculos={veiculos} />
                  {(newAcesso === 'app' || newAcesso === 'ambos') && (
                    <TelasList list={newTelas} setList={setNewTelas} />
                  )}
                </div>
                <div className="border-t px-8 py-5 flex gap-3 shrink-0">
                  <button onClick={() => setModalCriar(false)} className="flex-1 py-3 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleCriar} disabled={loading} className="flex-[2] py-3 text-xs font-black text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50">
                    <Check className="w-4 h-4" />{loading ? 'Criando...' : 'Criar e Enviar Convite'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR ── */}
      {modalEditar && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in" onClick={() => setModalEditar(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-lg animate-in slide-in-from-right duration-300 shadow-2xl">
              <div className="flex h-full flex-col bg-white overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-gray-900">Editar Usuário</h2>
                    <p className="text-xs text-gray-400 mt-1">{modalEditar.email}</p>
                  </div>
                  <button onClick={() => setModalEditar(null)} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 px-8 py-6 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nome</label>
                      <input type="text" value={editNome} onChange={e => setEditNome(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Telefone</label>
                      <input type="tel" value={editTelefone} onChange={e => setEditTelefone(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900"
                        placeholder="(11) 99999-9999" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Filial</label>
                      <input list="filiais-editar" type="text" value={editFilial} onChange={e => setEditFilial(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/30 font-bold text-gray-900" />
                      <datalist id="filiais-editar">
                        {filiaisDisponiveis.map(f => <option key={f} value={f} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Perfil</label>
                      <select value={editRole} onChange={e => setEditRole(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                        <option>Motorista</option><option>Analista de Frota</option><option>Gestor</option><option>Diretor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Plataforma</label>
                      <select value={editAcesso} onChange={e => setEditAcesso(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none bg-white font-bold text-gray-900">
                        <option value="app">App Mobile</option>
                        <option value="web">Painel Web</option>
                        <option value="ambos">App + Painel Web</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Data de Cadastro</span>
                    <span className="text-sm font-bold text-gray-600">{modalEditar.created_at ? fmtDate(modalEditar.created_at) : '—'}</span>
                  </div>
                  <VeiculoSelect value={editVeiculoId} onChange={setEditVeiculoId} veiculos={veiculos} />
                  {(editAcesso === 'app' || editAcesso === 'ambos') && (
                    <TelasList list={editTelas} setList={setEditTelas} />
                  )}
                </div>
                <div className="border-t px-8 py-5 flex gap-3 shrink-0">
                  <button onClick={() => setModalEditar(null)} className="flex-1 py-3 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleEditar} disabled={loading} className="flex-[2] py-3 text-xs font-black text-white bg-brand-primary rounded-xl hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50">
                    <Check className="w-4 h-4" />Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EXCLUIR ── */}
      {modalDeletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setModalDeletar(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Excluir Usuário</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja excluir <strong>{modalDeletar.nome}</strong>?
                A sessão ativa será encerrada imediatamente.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalDeletar(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm rounded-xl">Cancelar</button>
                <button onClick={handleDeletar} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl">Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RESET SENHA ── */}
      {modalReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setModalReset(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">Redefinir Senha</h3>
              <p className="text-sm text-gray-500 mb-6">
                Uma nova senha será gerada e enviada para <strong>{modalReset.email}</strong>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setModalReset(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm rounded-xl">Cancelar</button>
                <button onClick={handleResetSenha} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-xl">Enviar Nova Senha</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DETALHE DE LOG ── */}
      {logDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setLogDetail(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 z-10 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${ACOES_COLOR[logDetail.acao] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ACOES_LABEL[logDetail.acao] ?? logDetail.acao}
                </span>
                <p className="text-xs text-gray-400 mt-2">{fmtDate(logDetail.created_at)} · {logDetail.ip}</p>
              </div>
              <button onClick={() => setLogDetail(null)} className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Ator</p>
                  <p className="font-bold text-gray-800">{logDetail.ator_email}</p>
                  <p className="text-xs text-gray-500 capitalize">{logDetail.ator_perfil}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Usuário Afetado</p>
                  <p className="font-bold text-gray-800">{logDetail.usuario_afetado_email ?? '—'}</p>
                </div>
              </div>
              {logDetail.dados_antes && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Dados Anteriores</p>
                  <pre className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800 overflow-auto">
                    {JSON.stringify(logDetail.dados_antes, null, 2)}
                  </pre>
                </div>
              )}
              {logDetail.dados_depois && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Dados Novos</p>
                  <pre className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-800 overflow-auto">
                    {JSON.stringify(logDetail.dados_depois, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
