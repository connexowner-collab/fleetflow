import { NextResponse } from 'next/server'

/**
 * DEV ONLY — Auto-login como gestor para pular a tela de login durante desenvolvimento.
 * Esta rota não existe em produção (NODE_ENV check).
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const sessionData = Buffer.from(
    JSON.stringify({ email: 'dev@fleetflow.local', perfil: 'gestor', nome: 'Dev Gestor', sv: 0 })
  ).toString('base64')

  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  response.cookies.set('fleetflow-session', sessionData, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  return response
}
