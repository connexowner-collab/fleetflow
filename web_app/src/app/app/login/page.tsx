"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle, Truck, AtSign } from 'lucide-react'

export default function AppLogin() {
  const router = useRouter()
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [erro,         setErro]         = useState('')
  const [mounted,      setMounted]      = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
        setErro(json.error ?? 'Credenciais inválidas. Tente novamente.')
        return
      }
      router.push('/app/home')
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div suppressHydrationWarning className="flex flex-col min-h-screen overflow-y-auto bg-white px-6">
      <div className="flex flex-col items-center justify-center flex-1 gap-6">

        {/* Logo */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg, #4B3FE4 0%, #7C3AED 100%)' }}>
            <Truck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">FleetFlow</h1>
          <p className="text-gray-500 text-sm mt-1">Logística com precisão e controle.</p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="w-full bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {erro}
          </div>
        )}

        {/* Form */}
        <form onSubmit={entrar} className="w-full space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl px-4 py-3.5 pr-11 text-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <AtSign className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Senha</label>
              <button type="button" className="text-xs text-indigo-600 font-semibold">Esqueceu a senha?</button>
            </div>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl px-4 py-3.5 pr-11 text-sm placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold rounded-2xl py-4 text-sm transition-all disabled:opacity-60 active:scale-[.98]"
            style={{ background: 'linear-gradient(135deg, #4B3FE4 0%, #7C3AED 100%)' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : 'Entrar'}
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center">
          Não possui conta?{' '}
          <span className="text-indigo-600 font-semibold">Contate o administrador</span>
        </p>
      </div>
    </div>
  )
}
