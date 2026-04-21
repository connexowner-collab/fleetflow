import { NextResponse, type NextRequest } from 'next/server'

function parseSession(cookie?: string) {
  if (!cookie) return null
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString('utf8')) as {
      email: string; perfil: string; nome: string; sv?: number
    }
  } catch { return null }
}

// Detecta se a requisição vem do domínio do PWA do motorista
function isDriverDomain(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? request.nextUrl.hostname
  const envMode = process.env.NEXT_PUBLIC_APP_MODE
  if (envMode === 'driver') return true
  if (envMode === 'admin')  return false
  // Fallback: detecta pelo hostname
  return host.includes('fleetflow-tau') || host.includes('driver')
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const driverDomain = isDriverDomain(request)

  const isPublicRoute =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/offline') ||
    pathname.startsWith('/landing') ||
    (driverDomain  && pathname.startsWith('/app/login')) ||
    (!driverDomain && pathname.startsWith('/login'))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // No domínio do motorista: bloquear qualquer rota fora de /app/*
  if (driverDomain && !pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/login'
    return NextResponse.redirect(url)
  }

  // No domínio admin: bloquear rotas do app
  if (!driverDomain && pathname.startsWith('/app/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const rawSession = request.cookies.get('fleetflow-session')?.value
  const session    = parseSession(rawSession)

  // Sem sessão → login correto
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = driverDomain ? '/app/login' : '/login'
    return NextResponse.redirect(url)
  }

  // Motorista tentando acessar rota de admin → /app/home
  if (session.perfil === 'motorista' && !pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/home'
    return NextResponse.redirect(url)
  }

  // Gestor tentando acessar rota do app → /login (no domínio driver, força logout)
  if (session.perfil !== 'motorista' && pathname.startsWith('/app/')) {
    const url = request.nextUrl.clone()
    url.pathname = driverDomain ? '/app/login' : '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
