"use client"

import { useEffect, useState } from 'react'
import { Eye, EyeOff, X, ChevronRight, Settings, Shield, HelpCircle, LogOut, Car, Building2, Bell } from 'lucide-react'
import BottomNav from '../components/BottomNav'

interface Profile {
  nome: string; email: string; perfil: string
  veiculo?: { placa: string; modelo: string; marca: string } | null
  filial?: string | null
}

function ModalSenha({ onClose }: { onClose: () => void }) {
  const [senhaAtual,  setSenhaAtual]  = useState('')
  const [novaSenha,   setNovaSenha]   = useState('')
  const [confirmar,   setConfirmar]   = useState('')
  const [showAtual,   setShowAtual]   = useState(false)
  const [showNova,    setShowNova]    = useState(false)
  const [showConf,    setShowConf]    = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [erro,        setErro]        = useState<string | null>(null)
  const [sucesso,     setSucesso]     = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (novaSenha.length < 6) { setErro('Mínimo 6 caracteres.'); return }
    if (novaSenha !== confirmar) { setErro('As senhas não conferem.'); return }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      const json = await res.json()
      if (!res.ok) setErro(json.message ?? 'Erro ao alterar senha.')
      else { setSucesso(true); setTimeout(onClose, 1500) }
    } catch { setErro('Erro de conexão.') } finally { setLoading(false) }
  }

  const Field = ({ label, value, onChange, show, toggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void }) => (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm pr-11 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Alterar Senha</h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100"><X className="w-4 h-4 text-gray-600" /></button>
        </div>
        {sucesso ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-gray-900 font-semibold">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <Field label="Senha Atual" value={senhaAtual} onChange={setSenhaAtual} show={showAtual} toggle={() => setShowAtual(v => !v)} />
            <Field label="Nova Senha" value={novaSenha} onChange={setNovaSenha} show={showNova} toggle={() => setShowNova(v => !v)} />
            <Field label="Confirmar Nova Senha" value={confirmar} onChange={setConfirmar} show={showConf} toggle={() => setShowConf(v => !v)} />
            {erro && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{erro}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm">Cancelar</button>
              <button type="submit" disabled={loading || !senhaAtual || !novaSenha || !confirmar}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
                {loading ? '...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function PerfilPage() {
  const [profile,    setProfile]    = useState<Profile | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [modalSenha, setModalSenha] = useState(false)

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(json => {
        const p = json.profile ?? json
        setProfile(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    if (!confirm('Deseja sair do FleetFlow?')) return
    await fetch('/api/auth/login', { method: 'DELETE' })
    window.location.href = '/app/login'
  }

  const iniciais = profile?.nome?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const perfilLabel: Record<string, string> = {
    motorista: 'MOTORISTA', gestor: 'GESTOR', analista: 'ANALISTA', diretor: 'DIRETOR'
  }

  const menuItems = [
    { icon: Settings,  label: 'Configurações da Conta', action: () => setModalSenha(true) },
    { icon: Shield,    label: 'Privacidade e Segurança', action: () => setModalSenha(true) },
    { icon: HelpCircle,label: 'Ajuda e Suporte',        action: () => {} },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6FB] pb-20">

      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">FleetFlow</span>
        </div>
        <Bell className="w-5 h-5 text-gray-400" />
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Avatar + Info */}
        {loading ? (
          <div className="bg-white rounded-3xl h-52 animate-pulse" />
        ) : (
          <div className="bg-white rounded-3xl p-6 flex flex-col items-center text-center shadow-sm border border-gray-100">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
                   style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
                {iniciais}
              </div>
              <button className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-white">
                <span className="text-white text-xs">✏</span>
              </button>
            </div>
            <h2 className="text-lg font-bold text-gray-900">{profile?.nome ?? '...'}</h2>
            <p className="text-gray-400 text-sm">{profile?.email ?? '...'}</p>
            <span className="mt-2 text-xs font-bold px-3 py-1 rounded-full text-white"
                  style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
              {perfilLabel[profile?.perfil ?? ''] ?? (profile?.perfil?.toUpperCase() ?? '')}
            </span>
          </div>
        )}

        {/* Unidade + Veículo */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unidade</p>
              </div>
              <p className="text-gray-900 font-bold text-sm">{profile?.filial ?? '—'}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-indigo-400" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Veículo</p>
              </div>
              <p className="text-gray-900 font-bold text-sm">{profile?.veiculo?.placa ?? '—'}</p>
            </div>
          </div>
        )}

        {/* Menu */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {menuItems.map(item => (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-gray-500" />
                </div>
                <span className="flex-1 text-left text-sm font-medium text-gray-700">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}

        {/* Logout */}
        {!loading && (
          <button onClick={logout}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-red-500 hover:bg-red-50 transition-colors">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-semibold text-sm">Sair da conta</span>
          </button>
        )}
      </div>

      {modalSenha && <ModalSenha onClose={() => setModalSenha(false)} />}
      <BottomNav />
    </div>
  )
}
