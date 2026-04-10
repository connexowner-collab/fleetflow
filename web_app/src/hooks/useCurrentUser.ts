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
  return match?.split('=')[1]
}

export function useCurrentUser(): CurrentUser | null {
  return useMemo(() => {
    const raw = getCookie('fleetflow-session')
    if (!raw) return null
    try {
      const decoded = atob(raw)
      const parsed = JSON.parse(decoded)
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
