import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // G4.2: Check profile exists and is active before auth attempt
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, perfil, nome, ativo, session_version, deleted_at')
    .eq('email', email.trim().toLowerCase())
    .is('deleted_at', null)
    .single()

  if (profile?.ativo === false) {
    return NextResponse.json({ error: 'Usuário inativo. Contate o administrador.' }, { status: 401 })
  }

  // Authenticate via Supabase Auth
  const { createClient } = await import('@supabase/supabase-js')
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error: authError } = await authClient.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (authError) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
  }

  const perfil = profile?.perfil ?? 'motorista'
  const nome = profile?.nome ?? email
  const sv = profile?.session_version ?? 0

  // G4.3: Include session_version in cookie to enable invalidation
  const sessionData = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), perfil, nome, sv })
  ).toString('base64')

  const userDisplay = Buffer.from(JSON.stringify({ perfil, nome })).toString('base64')
  const cookieOpts = `Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
  const securePart = process.env.NODE_ENV === 'production' ? '; Secure' : ''

  const response = NextResponse.json({ ok: true, perfil, nome })

  // fleetflow-session: httpOnly — protege o servidor e o proxy middleware
  response.headers.append('Set-Cookie', `fleetflow-session=${sessionData}; HttpOnly${securePart}; ${cookieOpts}`)

  // fleetflow-user: legível pelo JS — usado pelo useCurrentUser para exibir menus
  response.headers.append('Set-Cookie', `fleetflow-user=${userDisplay}${securePart}; ${cookieOpts}`)

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', 'fleetflow-session=; HttpOnly; Path=/; Max-Age=0')
  response.headers.append('Set-Cookie', 'fleetflow-user=; Path=/; Max-Age=0')
  return response
}
