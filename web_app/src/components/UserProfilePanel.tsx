"use client";

import {
  User, KeyRound, Bell, Shield, Palette, HelpCircle, LogOut, X,
  ChevronRight, Building2, Smartphone, ArrowLeft, Check, Eye,
  EyeOff, Save, AlertCircle, CheckCircle, Info, Sun, Moon,
  Monitor, Type, Mail, Lock, RefreshCw, ExternalLink, Camera, Upload,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState, useEffect, useCallback, useRef } from "react";

interface UserProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

type View =
  | null
  | 'perfil'
  | 'senha'
  | '2fa'
  | 'notificacoes'
  | 'aparencia'
  | 'empresa'
  | 'permissoes'
  | 'suporte';

interface ProfileData {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  created_at: string;
  tenant_id: string;
}

interface TenantData {
  nome: string;
  cnpj: string | null;
  email: string | null;
  slug: string;
}

const PERFIL_LABEL: Record<string, string> = {
  diretor: 'Diretor', gestor: 'Gestor', analista: 'Analista', motorista: 'Motorista',
};

const PERFIL_PERMISSOES: Record<string, string[]> = {
  diretor:  ['Dashboard', 'Gestão da Frota', 'Checklists', 'Ocorrências', 'Manutenção', 'Combustível', 'Documentos', 'Rastreamento', 'Relatórios & BI', 'Notificações', 'Gestão de Acessos', 'Aprovações de Troca', 'Configurações'],
  gestor:   ['Dashboard', 'Gestão da Frota', 'Checklists', 'Ocorrências', 'Manutenção', 'Combustível', 'Documentos', 'Rastreamento', 'Relatórios & BI', 'Notificações', 'Gestão de Acessos', 'Aprovações de Troca', 'Configurações'],
  analista: ['Dashboard', 'Gestão da Frota', 'Checklists', 'Ocorrências', 'Manutenção', 'Combustível', 'Documentos', 'Rastreamento', 'Relatórios & BI', 'Notificações', 'Aprovações de Troca'],
  motorista:['Dashboard', 'Checklists', 'Ocorrências'],
};

function Alert({ type, msg }: { type: 'error' | 'success'; msg: string }) {
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
      {type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
      {msg}
    </div>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
      <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
    </div>
  );
}

// ─── Tela: Meu Perfil ────────────────────────────────────────
function ViewPerfil({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser();
  const [profile, setProfile] = useState<ProfileData & { avatar_url?: string } | null>(null);
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(j => {
        setProfile(j.profile);
        setNome(j.profile?.nome ?? '');
        setPreview(j.profile?.avatar_url ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setMsg(null);

    const fd = new FormData();
    fd.append('avatar', file);

    const res = await fetch('/api/auth/profile/avatar', { method: 'POST', body: fd });
    const json = await res.json();
    setUploading(false);

    if (res.ok) {
      setPreview(json.avatar_url);
      setProfile(p => p ? { ...p, avatar_url: json.avatar_url } : p);
      setMsg({ type: 'success', text: 'Foto atualizada com sucesso!' });
    } else {
      setMsg({ type: 'error', text: json.error ?? 'Erro ao enviar imagem.' });
      setPreview(profile?.avatar_url ?? null);
    }
    // Limpa input para permitir reenvio do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    const json = await res.json();
    setSalvando(false);
    if (res.ok) {
      setMsg({ type: 'success', text: 'Nome atualizado com sucesso!' });
      setProfile(p => p ? { ...p, nome: json.nome } : p);
    } else {
      setMsg({ type: 'error', text: json.error ?? 'Erro ao salvar.' });
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
    </div>
  );

  const iniciais = nome.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <>
      <SubHeader title="Meu Perfil" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Avatar com upload */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {/* Foto ou iniciais */}
            {preview ? (
              <img
                src={preview}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-2xl border-4 border-white shadow-lg">
                {iniciais}
              </div>
            )}

            {/* Overlay de hover */}
            <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-all ${uploading ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/40'}`}>
              {uploading ? (
                <RefreshCw className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>

            {/* Badge câmera */}
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-primary border-2 border-white flex items-center justify-center shadow">
              <Upload className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />

          <div className="text-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-brand-primary font-medium hover:underline disabled:opacity-50"
            >
              {uploading ? 'Enviando...' : 'Alterar foto'}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG ou WebP · Máx. 2 MB</p>
          </div>
        </div>

        {/* Campos */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{profile?.email ?? user?.email ?? '—'}</span>
              <Lock className="w-3 h-3 text-gray-300 ml-auto" />
            </div>
            <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado aqui.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Perfil de acesso</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">
              <Shield className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-medium text-brand-primary">{PERFIL_LABEL[profile?.perfil ?? ''] ?? profile?.perfil ?? '—'}</span>
              <Lock className="w-3 h-3 text-gray-300 ml-auto" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Membro desde</label>
            <p className="text-sm text-gray-600">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {msg && <Alert type={msg.type} msg={msg.text} />}

        <button
          onClick={salvar}
          disabled={salvando || !nome.trim() || nome === profile?.nome}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {salvando ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </>
  );
}

// ─── Tela: Alterar Senha ─────────────────────────────────────
function ViewSenha({ onBack }: { onBack: () => void }) {
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const forte = nova.length >= 8 && /[A-Z]/.test(nova) && /[0-9]/.test(nova);
  const media = nova.length >= 6;

  async function salvar() {
    setMsg(null);
    if (nova !== confirmar) { setMsg({ type: 'error', text: 'As senhas não coincidem.' }); return; }
    if (nova.length < 6) { setMsg({ type: 'error', text: 'Mínimo de 6 caracteres.' }); return; }
    setSalvando(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nova_senha: nova, confirmar_senha: confirmar }),
    });
    const json = await res.json();
    setSalvando(false);
    if (res.ok) {
      setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setNova(''); setConfirmar('');
    } else {
      setMsg({ type: 'error', text: json.error ?? 'Erro ao alterar senha.' });
    }
  }

  return (
    <>
      <SubHeader title="Alterar Senha" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <p className="text-xs text-gray-500">Escolha uma senha forte com pelo menos 8 caracteres, uma letra maiúscula e um número.</p>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nova senha</label>
          <div className="relative">
            <input
              type={showNova ? 'text' : 'password'}
              value={nova}
              onChange={e => setNova(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            <button type="button" onClick={() => setShowNova(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Barra de força */}
          {nova.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                <div className={`h-1.5 flex-1 rounded-full ${nova.length > 0 ? (forte ? 'bg-green-500' : media ? 'bg-yellow-400' : 'bg-red-400') : 'bg-gray-200'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${media ? (forte ? 'bg-green-500' : 'bg-yellow-400') : 'bg-gray-200'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${forte ? 'bg-green-500' : 'bg-gray-200'}`} />
              </div>
              <p className={`text-xs ${forte ? 'text-green-600' : media ? 'text-yellow-600' : 'text-red-500'}`}>
                {forte ? 'Senha forte' : media ? 'Senha média' : 'Senha fraca'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirmar nova senha</label>
          <div className="relative">
            <input
              type={showConfirmar ? 'text' : 'password'}
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            <button type="button" onClick={() => setShowConfirmar(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
              {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmar.length > 0 && nova !== confirmar && (
            <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
          )}
          {confirmar.length > 0 && nova === confirmar && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Senhas coincidem.</p>
          )}
        </div>

        {msg && <Alert type={msg.type} msg={msg.text} />}

        <button
          onClick={salvar}
          disabled={salvando || !nova || !confirmar}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          {salvando ? 'Alterando...' : 'Alterar senha'}
        </button>
      </div>
    </>
  );
}

// ─── Tela: Autenticação 2FA ──────────────────────────────────
function View2FA({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SubHeader title="Autenticação em 2 Fatores" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-brand-primary" />
          </div>
          <h3 className="font-semibold text-gray-800">Adicione uma camada extra de segurança</h3>
          <p className="text-sm text-gray-500">Com o 2FA ativo, você precisará de um código do app autenticador além da senha ao fazer login.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-blue-800">Como ativar:</p>
          {[
            'Instale o Google Authenticator ou Authy no seu celular.',
            'Clique em "Configurar 2FA" abaixo.',
            'Escaneie o QR Code que será exibido.',
            'Confirme com o código de 6 dígitos gerado.',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs text-blue-700">{step}</p>
            </div>
          ))}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700">Esta funcionalidade requer configuração no painel Supabase. Entre em contato com o administrador do sistema para habilitá-la.</p>
        </div>

        <button disabled className="w-full flex items-center justify-center gap-2 bg-brand-primary/40 text-white py-2.5 rounded-lg font-medium text-sm cursor-not-allowed">
          <Smartphone className="w-4 h-4" />
          Configurar 2FA (em breve)
        </button>
      </div>
    </>
  );
}

// ─── Tela: Notificações (Preferências) ───────────────────────
const NOTIF_KEYS = [
  { key: 'notif_ocorrencias',   label: 'Novas Ocorrências',       desc: 'Alertas quando ocorrências forem registradas' },
  { key: 'notif_checklists',    label: 'Checklists pendentes',     desc: 'Lembretes de checklists aguardando aprovação' },
  { key: 'notif_manutencao',    label: 'Manutenções agendadas',    desc: 'Avisos de revisões próximas' },
  { key: 'notif_documentos',    label: 'Vencimento de documentos', desc: 'Alertas 30 dias antes do vencimento' },
  { key: 'notif_trocas',        label: 'Aprovações de troca',      desc: 'Solicitações de troca de veículo' },
];

function ViewNotificacoes({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ff_notif_prefs');
    if (stored) setPrefs(JSON.parse(stored));
    else {
      const defaults: Record<string, boolean> = {};
      NOTIF_KEYS.forEach(k => { defaults[k.key] = true; });
      setPrefs(defaults);
    }
  }, []);

  function toggle(key: string) {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setSaved(false);
  }

  function salvar() {
    localStorage.setItem('ff_notif_prefs', JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <SubHeader title="Preferências de Notificações" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <p className="text-xs text-gray-500">Escolha quais notificações você deseja receber na central de alertas.</p>
        <div className="space-y-2">
          {NOTIF_KEYS.map(({ key, label, desc }) => (
            <label key={key} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <div
                onClick={() => toggle(key)}
                className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${prefs[key] ? 'bg-brand-primary' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${prefs[key] ? 'left-5' : 'left-1'}`} />
              </div>
            </label>
          ))}
        </div>

        <button onClick={salvar}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-primary/90 transition-colors">
          {saved ? <><Check className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar preferências</>}
        </button>
      </div>
    </>
  );
}

// ─── Tela: Aparência ─────────────────────────────────────────
const TEMAS = [
  { value: 'light',  label: 'Claro',   icon: Sun },
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'dark',   label: 'Escuro',  icon: Moon },
];

const FONTES = [
  { value: 'sm',   label: 'Pequena' },
  { value: 'base', label: 'Normal' },
  { value: 'lg',   label: 'Grande' },
];

function ViewAparencia({ onBack }: { onBack: () => void }) {
  const [tema, setTema] = useState('light');
  const [fonte, setFonte] = useState('base');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ff_aparencia');
    if (stored) { const p = JSON.parse(stored); setTema(p.tema ?? 'light'); setFonte(p.fonte ?? 'base'); }
  }, []);

  function salvar() {
    localStorage.setItem('ff_aparencia', JSON.stringify({ tema, fonte }));
    // Aplica tamanho de fonte no root
    document.documentElement.style.fontSize = fonte === 'sm' ? '14px' : fonte === 'lg' ? '17px' : '16px';
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <SubHeader title="Aparência" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Tema */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tema</p>
          <div className="grid grid-cols-3 gap-2">
            {TEMAS.map(({ value, label, icon: Icon }) => (
              <button key={value} onClick={() => setTema(value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  tema === value ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}>
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
          {tema !== 'light' && (
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" /> Tema escuro será implementado em breve.
            </p>
          )}
        </div>

        {/* Tamanho de fonte */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tamanho da fonte</p>
          <div className="grid grid-cols-3 gap-2">
            {FONTES.map(({ value, label }) => (
              <button key={value} onClick={() => setFonte(value)}
                className={`flex items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all font-medium ${
                  fonte === value ? 'border-brand-primary bg-brand-primary/5 text-brand-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                style={{ fontSize: value === 'sm' ? '12px' : value === 'lg' ? '15px' : '13px' }}>
                <Type className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={salvar}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-primary/90 transition-colors">
          {saved ? <><Check className="w-4 h-4" /> Aplicado!</> : <><Save className="w-4 h-4" /> Aplicar aparência</>}
        </button>
      </div>
    </>
  );
}

// ─── Tela: Minha Empresa ─────────────────────────────────────
function ViewEmpresa({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(j => { setTenant(j.tenant); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const isDiretor = user?.perfil === 'diretor' || user?.perfil === 'gestor';

  return (
    <>
      <SubHeader title="Minha Empresa" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 text-gray-400 animate-spin" /></div>
        ) : !tenant ? (
          <p className="text-sm text-gray-400 text-center py-8">Dados da empresa não encontrados.</p>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tenant.nome}</p>
                <p className="text-xs text-gray-500">{tenant.slug}</p>
              </div>
            </div>

            {[
              { label: 'Razão Social', value: tenant.nome },
              { label: 'CNPJ', value: tenant.cnpj ?? 'Não informado' },
              { label: 'E-mail corporativo', value: tenant.email ?? 'Não informado' },
              { label: 'Identificador', value: tenant.slug },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                <p className="text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50">{value}</p>
              </div>
            ))}

            {!isDiretor && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">Para editar os dados da empresa, acesse o módulo de <strong>Configurações</strong> com perfil Diretor ou Gestor.</p>
              </div>
            )}

            {isDiretor && (
              <a href="/configuracoes"
                className="w-full flex items-center justify-center gap-2 border border-brand-primary text-brand-primary py-2.5 rounded-lg font-medium text-sm hover:bg-brand-primary/5 transition-colors">
                <ExternalLink className="w-4 h-4" /> Editar nas Configurações
              </a>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Tela: Permissões de Acesso ──────────────────────────────
function ViewPermissoes({ onBack }: { onBack: () => void }) {
  const user = useCurrentUser();
  const perfil = user?.perfil ?? 'motorista';
  const perms = PERFIL_PERMISSOES[perfil] ?? [];

  const todos = PERFIL_PERMISSOES['diretor'];

  return (
    <>
      <SubHeader title="Permissões de Acesso" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
          <Shield className="w-5 h-5 text-brand-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-800">Perfil: <span className="text-brand-primary">{PERFIL_LABEL[perfil]}</span></p>
            <p className="text-xs text-gray-500 mt-0.5">Acesso a {perms.length} de {todos.length} módulos</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Módulos disponíveis</p>
        <div className="space-y-1.5">
          {todos.map(modulo => {
            const temAcesso = perms.includes(modulo);
            return (
              <div key={modulo} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${temAcesso ? 'bg-green-50' : 'bg-gray-50 opacity-60'}`}>
                <span className={temAcesso ? 'text-gray-800 font-medium' : 'text-gray-400'}>{modulo}</span>
                {temAcesso
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <X className="w-4 h-4 text-gray-300" />}
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">Para solicitar alteração de permissões, contate o administrador do sistema.</p>
        </div>
      </div>
    </>
  );
}

// ─── Tela: Ajuda & Suporte ───────────────────────────────────
const FAQS = [
  { q: 'Como registrar uma ocorrência?', a: 'Acesse o menu Ocorrências > Nova Ocorrência. Preencha os dados e anexe fotos se necessário.' },
  { q: 'Como aprovar um checklist?', a: 'Vá em Checklists, clique no checklist desejado e use os botões Aprovar ou Recusar no painel de detalhes.' },
  { q: 'Como agendar uma manutenção?', a: 'Acesse Manutenção > Nova Manutenção, selecione o veículo, tipo e data de agendamento.' },
  { q: 'Esqueci minha senha, o que faço?', a: 'Na tela de login, clique em "Esqueci minha senha" ou contate o administrador para reset.' },
  { q: 'Como exportar relatórios?', a: 'Acesse o menu Relatórios & BI e clique no botão "Exportar CSV" no canto superior direito.' },
];

function ViewSuporte({ onBack }: { onBack: () => void }) {
  const [aberto, setAberto] = useState<number | null>(null);

  return (
    <>
      <SubHeader title="Ajuda & Suporte" onBack={onBack} />
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Versão */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Versão do sistema</p>
            <p className="text-sm font-semibold text-gray-800">FleetFlow v1.0.0</p>
          </div>
          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Atualizado</span>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Perguntas frequentes</p>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setAberto(aberto === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-800 pr-2">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${aberto === i ? 'rotate-90' : ''}`} />
                </button>
                {aberto === i && (
                  <div className="px-4 pb-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contato */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato & Suporte</p>
          <a href="mailto:suporte@fleetflow.com.br"
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <Mail className="w-5 h-5 text-brand-primary" />
            <div>
              <p className="text-sm font-medium text-gray-800">E-mail de suporte</p>
              <p className="text-xs text-gray-400">suporte@fleetflow.com.br</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 ml-auto" />
          </a>
        </div>
      </div>
    </>
  );
}

// ─── Componente principal ────────────────────────────────────
const menuItems = [
  { section: 'Conta', items: [
    { key: 'perfil' as View,        icon: User,       label: 'Meu Perfil',                   description: 'Editar dados pessoais' },
    { key: 'senha' as View,         icon: KeyRound,   label: 'Alterar Senha',                description: 'Segurança da conta' },
    { key: '2fa' as View,           icon: Smartphone, label: 'Autenticação em 2 Fatores',    description: 'MFA / TOTP' },
  ]},
  { section: 'Preferências', items: [
    { key: 'notificacoes' as View,  icon: Bell,       label: 'Notificações',                 description: 'Alertas e avisos' },
    { key: 'aparencia' as View,     icon: Palette,    label: 'Aparência',                    description: 'Tema e exibição' },
  ]},
  { section: 'Empresa', items: [
    { key: 'empresa' as View,       icon: Building2,  label: 'Minha Empresa',                description: 'Dados organizacionais' },
    { key: 'permissoes' as View,    icon: Shield,     label: 'Permissões de Acesso',         description: 'Nível de acesso' },
  ]},
  { section: 'Suporte', items: [
    { key: 'suporte' as View,       icon: HelpCircle, label: 'Ajuda & Suporte',              description: 'FAQ e contato' },
  ]},
];

export default function UserProfilePanel({ open, onClose }: UserProfilePanelProps) {
  const user = useCurrentUser();
  const [view, setView] = useState<View>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Carrega avatar ao abrir o painel
  useEffect(() => {
    if (open) {
      fetch('/api/auth/profile')
        .then(r => r.json())
        .then(j => setAvatarUrl(j.profile?.avatar_url ?? null))
        .catch(() => {});
    }
  }, [open]);

  const nomeCurto   = mounted ? (user?.nome || user?.email || 'Usuário') : 'Usuário';
  const iniciais    = nomeCurto.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
  const perfilLabel = mounted ? (PERFIL_LABEL[user?.perfil ?? ''] ?? (user?.perfil ?? '—')) : '—';

  // Fecha sub-tela ao fechar o painel
  const handleClose = useCallback(() => { setView(null); onClose(); }, [onClose]);
  const handleBack  = useCallback(() => setView(null), []);

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    window.location.href = '/login';
  }

  function renderView() {
    switch (view) {
      case 'perfil':       return <ViewPerfil onBack={handleBack} />;
      case 'senha':        return <ViewSenha onBack={handleBack} />;
      case '2fa':          return <View2FA onBack={handleBack} />;
      case 'notificacoes': return <ViewNotificacoes onBack={handleBack} />;
      case 'aparencia':    return <ViewAparencia onBack={handleBack} />;
      case 'empresa':      return <ViewEmpresa onBack={handleBack} />;
      case 'permissoes':   return <ViewPermissoes onBack={handleBack} />;
      case 'suporte':      return <ViewSuporte onBack={handleBack} />;
      default:             return null;
    }
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={handleClose} />}

      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Sub-view com animação */}
        <div className={`absolute inset-0 flex flex-col bg-white z-10 transition-transform duration-300 ${view ? 'translate-x-0' : 'translate-x-full'}`}>
          {renderView()}
        </div>

        {/* Menu principal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Perfil do Usuário</span>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-5 py-5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-primary/20 flex items-center justify-center text-brand-primary font-bold text-lg flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                : (iniciais || <User className="w-5 h-5" />)
              }
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{nomeCurto}</p>
              <p className="text-xs text-brand-primary font-medium">FleetFlow</p>
              <p className="text-xs text-gray-400 mt-0.5">{mounted ? (user?.email || '—') : '—'}</p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
            Ativo · {perfilLabel}
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {menuItems.map((group) => (
            <div key={group.section}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">{group.section}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setView(item.key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
                        <div className="text-left">
                          <p className="text-sm text-gray-700 font-medium">{item.label}</p>
                          <p className="text-xs text-gray-400">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors group">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        </div>
      </div>
    </>
  );
}
