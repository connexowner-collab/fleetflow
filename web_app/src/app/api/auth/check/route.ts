import { NextResponse, NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getSessionFromRequest } from '@/utils/auth/session'

/**
 * G4.3 — Verifica se a sessão do cookie ainda é válida comparando session_version com o DB.
 * Chamado pelo layout do dashboard no mount do cliente.
 */
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('ativo, session_version, deleted_at')
    .eq('email', session.email)
    .is('deleted_at', null)
    .single()

  if (!profile || !profile.ativo) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  // Check session version — if incremented on server, cookie is stale
  const cookieSv = (session as { sv?: number }).sv ?? 0
  if (profile.session_version !== cookieSv) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  return NextResponse.json({ valid: true })
}
