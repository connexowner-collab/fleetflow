"use client"

import { useEffect, useState } from 'react'
import { Lock, Car, Eye, EyeOff, X, ChevronRight } from 'lucide-react'
import BottomNav from '../components/BottomNav'

interface Profile {
  nome: string
  email: string
  perfil: string
  veiculo?: {
    placa: string
    modelo: string
    marca: string
  } | null
}

// ─── Modal de alterar senha ───────────────────────────────────────────────────

interface ModalSenhaProps {
  onClose: () => void
}

function ModalSenha({ onClose }: ModalSenhaProps) {
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

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não conferem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senhaAtual, novaSenha }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.message ?? 'Erro ao alterar senha.')
      } else {
        setSucesso(true)
        setTimeout(onClose, 1500)
      }
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">

        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-700">
          <h2 className="text-white font-bold text-base">Alterar Senha</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sucesso ? (
          <div className="px-5 py-8 text-center">
            <p className="text-green-400 font-semibold">Senha alterada com sucesso!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="px-5 py-5 space-y-4">

            {/* Senha atual */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Senha atual</label>
              <div className="relative">
                <input
                  type={showAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm w-full pr-11 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAtual(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showAtual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nova senha */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Nova senha</label>
              <div className="relative">
                <input
                  type={showNova ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm w-full pr-11 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNova(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showNova ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-medium">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type={showConf ? 'text' : 'password'}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm w-full pr-11 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConf(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                {erro}
              </p>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white rounded-xl py-3 font-semibold w-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-1"
            >
              {loading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="animate-pulse space-y-5 px-4 pt-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-slate-700" />
        <div className="h-5 w-36 bg-slate-700 rounded" />
        <div className="h-4 w-48 bg-slate-700 rounded" />
        <div className="h-5 w-20 bg-slate-700 rounded-full" />
      </div>
      {/* Cards */}
      <div className="h-24 bg-slate-800 rounded-2xl" />
      <div className="h-24 bg-slate-800 rounded-2xl" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [loading, setLoading]       = useState(true)
  const [modalSenha, setModalSenha] = useState(false)
  const [saindo, setSaindo]         = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch('/api/auth/profile')
        const json = await res.json()
        const p    = json.profile ?? json
        setProfile({
          nome:    p.nome,
          email:   p.email,
          perfil:  p.perfil,
          veiculo: p.veiculo ?? null,
        })
      } catch {
        // falha silenciosa — offline
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function sair() {
    if (!confirm('Deseja sair do FleetFlow?')) return
    setSaindo(true)
    try {
      await fetch('/api/auth/login', { method: 'DELETE' })
    } catch { /* ignora */ }
    window.location.href = '/app/login'
  }

  // Inicial do avatar
  const inicial = profile?.nome?.trim().charAt(0).toUpperCase() ?? '?'

  // Label legível para o perfil
  const perfilLabel: Record<string, string> = {
    motorista:      'Motorista',
    admin:          'Administrador',
    gestor:         'Gestor',
    manutencao:     'Manutenção',
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 max-w-md mx-auto">

      {/* Header */}
      <header className="px-5 pt-12 pb-4 bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <h1 className="text-white font-bold text-lg">Meu Perfil</h1>
      </header>

      {loading ? (
        <Skeleton />
      ) : (
        <main className="flex-1 px-4 py-6 space-y-5">

          {/* ── Avatar + dados ────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <span className="text-white text-2xl font-bold">{inicial}</span>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg leading-tight">
                {profile?.nome ?? '—'}
              </p>
              <p className="text-slate-400 text-sm mt-0.5">
                {profile?.email ?? '—'}
              </p>
            </div>
            {profile?.perfil && (
              <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-600/30">
                {perfilLabel[profile.perfil] ?? profile.perfil}
              </span>
            )}
          </div>

          {/* ── Card Segurança ────────────────────────────────────── */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-slate-400" />
              <h2 className="text-white font-semibold text-sm">Segurança</h2>
            </div>
            <button
              onClick={() => setModalSenha(true)}
              className="flex items-center justify-between w-full group"
            >
              <div>
                <p className="text-white text-sm font-medium">Alterar Senha</p>
                <p className="text-slate-400 text-xs mt-0.5">Atualize sua senha de acesso</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>
          </div>

          {/* ── Card Veículo Vinculado ────────────────────────────── */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Car className="w-4 h-4 text-slate-400" />
              <h2 className="text-white font-semibold text-sm">Veículo Vinculado</h2>
            </div>

            {profile?.veiculo ? (
              <div className="space-y-1">
                <p className="text-white text-2xl font-bold tracking-widest">
                  {profile.veiculo.placa}
                </p>
                <p className="text-slate-300 text-sm">
                  {profile.veiculo.marca} {profile.veiculo.modelo}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="bg-slate-700 rounded-xl p-2.5">
                  <Car className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Nenhum veículo vinculado</p>
                  <p className="text-slate-500 text-xs mt-0.5">Consulte seu gestor</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Botão Sair ───────────────────────────────────────── */}
          <button
            onClick={sair}
            disabled={saindo}
            className="bg-red-600/20 border border-red-600/40 text-red-400 rounded-xl py-3 font-semibold w-full hover:bg-red-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saindo ? 'Saindo...' : 'Sair'}
          </button>

          {/* ── Versão ───────────────────────────────────────────── */}
          <p className="text-center text-slate-600 text-xs pb-2">FleetFlow v1.0</p>

        </main>
      )}

      {/* Modal de senha */}
      {modalSenha && <ModalSenha onClose={() => setModalSenha(false)} />}

      <BottomNav />
    </div>
  )
}
