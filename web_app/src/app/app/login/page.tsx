"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Truck, Download } from 'lucide-react'

export default function AppLogin() {
  const router = useRouter()
  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [erro, setErro]             = useState('')
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [instalado, setInstalado]   = useState(false)

  useEffect(() => {
    // Captura o prompt de instalação PWA
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Verifica se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalado(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalarApp() {
    if (!installPrompt) return
    const prompt = installPrompt as BeforeInstallPromptEvent
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setInstalado(true)
    }
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: senha }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErro(json.error ?? 'E-mail ou senha incorretos.')
        return
      }
      // Redirecionar ao APP
      router.push('/app/home')
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 px-6">
      {/* Logo */}
      <div className="flex flex-col items-center justify-center flex-1 gap-8">
        <div className="text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900">
            <Truck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">FleetFlow</h1>
          <p className="text-slate-400 text-sm mt-1">App do Motorista</p>
        </div>

        {/* Formulário */}
        <form onSubmit={entrar} className="w-full space-y-4">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-2">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wide mb-2">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 p-1"
              >
                {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="bg-red-900/50 border border-red-800 rounded-xl px-4 py-3 text-red-300 text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl py-3.5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Entrar'}
          </button>
        </form>

        {/* Botão Instalar APP */}
        {installPrompt && !instalado && (
          <button
            onClick={instalarApp}
            className="w-full border border-blue-600 text-blue-400 rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-900/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            Instalar APP no celular
          </button>
        )}

        {instalado && (
          <p className="text-green-400 text-xs text-center flex items-center gap-1">
            ✓ App instalado no celular
          </p>
        )}
      </div>

      <p className="text-slate-600 text-xs text-center pb-8">
        FleetFlow v1.0 — Painel de acesso exclusivo para motoristas
      </p>
    </div>
  )
}

// Tipo para o evento de instalação PWA
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}
