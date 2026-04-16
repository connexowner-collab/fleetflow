"use client"

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}

export default function InstallPWA() {
  const [prompt, setPrompt]     = useState<BeforeInstallPromptEvent | null>(null)
  const [mostrar, setMostrar]   = useState(false)
  const [instalado, setInstalado] = useState(false)

  useEffect(() => {
    // Já está instalado como PWA standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalado(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      setMostrar(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalado(true)
      setMostrar(false)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function instalar() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalado(true)
      setMostrar(false)
    }
  }

  if (!mostrar || instalado) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-3 md:max-w-sm md:left-auto md:right-4">
      <div className="bg-blue-600 p-2.5 rounded-xl shrink-0">
        <Download className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">Instalar FleetFlow</p>
        <p className="text-slate-400 text-xs mt-0.5">Acesse rapidamente pelo celular</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={instalar}
          className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Instalar
        </button>
        <button
          onClick={() => setMostrar(false)}
          className="text-slate-500 hover:text-slate-300 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
