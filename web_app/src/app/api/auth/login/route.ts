import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
  }

  const supabase = createAdminClient()

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

  // Fetch perfil from profiles table using admin client
  const { data: profile } = await supabase
    .from('profiles')
    .select('perfil, nome')
    .eq('email', email.trim().toLowerCase())
    .single()

  const perfil = profile?.perfil ?? 'motorista'
  const nome = profile?.nome ?? email

  const sessionData = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), perfil, nome })
  ).toString('base64')

  const response = NextResponse.json({ ok: true, perfil, nome })
  response.cookies.set('fleetflow-session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete('fleetflow-session')
  return response
}
