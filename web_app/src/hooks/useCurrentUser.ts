"use client";

import { useMemo } from 'react';

export type UserPerfil = 'gestor' | 'diretor' | 'analista' | 'motorista'

export interface CurrentUser {
  email: string
  perfil: UserPerfil
  nome: string
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
  if (!match) return undefined
  return match.slice(name.length + 1)
}

export function useCurrentUser(): CurrentUser | null {
  return useMemo(() => {
    // fleetflow-user: cookie JS-acessível com perfil e nome
    const userRaw = getCookie('fleetflow-user')
    if (userRaw) {
      try {
        const parsed = JSON.parse(atob(userRaw))
        const sessionRaw = getCookie('fleetflow-session')
        let email = ''
        if (sessionRaw) {
          try { email = JSON.parse(atob(sessionRaw)).email ?? '' } catch { /* ignore */ }
        }
        return {
          email,
          perfil: parsed.perfil ?? 'motorista',
          nome: parsed.nome ?? '',
        }
      } catch { /* ignore */ }
    }

    // fallback: fleetflow-session direto (caso não-httpOnly)
    const raw = getCookie('fleetflow-session')
    if (!raw) return null
    try {
      const parsed = JSON.parse(atob(raw))
      return {
        email: parsed.email ?? '',
        perfil: parsed.perfil ?? 'motorista',
        nome: parsed.nome ?? parsed.email ?? '',
      }
    } catch {
      return null
    }
  }, [])
}

export function canManageFleet(perfil: UserPerfil): boolean {
  return perfil === 'gestor' || perfil === 'diretor'
}

export function canDeleteVehicle(perfil: UserPerfil): boolean {
  return perfil === 'gestor' || perfil === 'diretor'
}

export function canViewFleet(perfil: UserPerfil): boolean {
  return perfil !== 'motorista'
}
