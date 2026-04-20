import { NextResponse, type NextRequest } from 'next/server'

function parseSession(cookie?: string) {
  if (!cookie) return null
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString('utf8')) as {
      email: string; perfil: string; nome: string; sv?: number
    }
  } catch { return null }
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/app/login') ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/offline') ||
    pathname.startsWith('/api/')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const rawSession = request.cookies.get('fleetflow-session')?.value
  const session    = parseSession(rawSession)

  // Sem sessão → redirecionar para o login correto
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.startsWith('/app') ? '/app/login' : '/login'
    return NextResponse.redirect(url)
  }

  // Motorista tentando acessar rota de admin → redirecionar para /app/home
  if (session.perfil === 'motorista' && !pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/home'
    return NextResponse.redirect(url)
  }

  // Gestor/admin tentando acessar rota do app → redirecionar para /
  if (session.perfil !== 'motorista' && pathname.startsWith('/app/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
