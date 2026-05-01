"use client"

import { Car, RefreshCw, Bell, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AppHeaderProps {
  notifs?: number
  refreshing?: boolean
  onRefresh?: () => void
  onLogout?: () => void
  onBack?: () => void
  showActions?: boolean
}

export default function AppHeader({ 
  notifs = 0, 
  refreshing = false, 
  onRefresh, 
  onLogout,
  onBack,
  showActions = true
}: AppHeaderProps) {
  
  const handleClearCache = async () => {
    try {
      // Limpa caches do Service Worker
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      }
      // Limpa storage local
      localStorage.clear()
      sessionStorage.clear()
      // Recarrega a página
      window.location.reload()
    } catch (err) {
      console.error('Erro ao limpar cache:', err)
      window.location.reload()
    }
  }

  return (
    <div className="bg-white px-5 pt-12 pb-4 flex items-center justify-between shadow-sm border-b border-gray-100">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1.5 bg-gray-100 rounded-xl">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Logo com Botão Invisível */}
        <div className="relative flex items-center gap-2">
          <button 
            onClick={handleClearCache}
            className="absolute inset-0 z-10 opacity-0 cursor-default"
            title="Limpar Cache"
          />
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#4B3FE4,#7C3AED)' }}>
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-base">FleetFlow</span>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button onClick={onRefresh} className="p-2">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          <Link href="/app/notificacoes" className="relative p-2">
            <Bell className="w-5 h-5 text-gray-600" />
            {notifs > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {notifs > 9 ? '9+' : notifs}
              </span>
            )}
          </Link>
          {onLogout && (
            <button onClick={onLogout} className="p-1">
              <LogOut className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
