import { NextRequest } from 'next/server'

export type UserPerfil = 'gestor' | 'diretor' | 'analista' | 'motorista'

export interface SessionUser {
  email: string
  perfil: UserPerfil
  nome: string
}

export function getSessionFromRequest(request: NextRequest): SessionUser | null {
  const cookie = request.cookies.get('fleetflow-session')
  if (!cookie?.value) return null
  try {
    const decoded = Buffer.from(cookie.value, 'base64').toString('utf-8')
    const parsed = JSON.parse(decoded)
    return {
      email: parsed.email ?? '',
      perfil: parsed.perfil ?? 'motorista',
      nome: parsed.nome ?? parsed.email ?? '',
    }
  } catch {
    return null
  }
}

export function canManageFleet(perfil: UserPerfil): boolean {
  return perfil === 'gestor' || perfil === 'diretor'
}

export function canViewFleet(perfil: UserPerfil): boolean {
  return perfil !== 'motorista'
}
