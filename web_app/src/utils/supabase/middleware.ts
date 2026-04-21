import { NextResponse, type NextRequest } from 'next/server'

function parseSession(cookie?: string) {
  if (!cookie) return null
  try {
    return JSON.parse(Buffer.from(cookie, 'base64').toString('utf8')) as {
      email: string; perfil: string; nome: string; sv?: number
    }
  } catch { return null }
}

// Detecta se a requisição vem do domínio do PWA
function isDriverDomain(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? request.nextUrl.hostname
  const envMode = process.env.NEXT_PUBLIC_APP_MODE
  if (envMode === 'driver') return true
  if (envMode === 'admin')  return false
  return host.includes('fleetflow-tau') || host.includes('driver')
}

// Perfis que podem acessar SOMENTE o admin (não têm acesso ao /app/* via dashboard)
// Todos os perfis podem usar o PWA /app/*
const ADMIN_ONLY_ROUTES = ['/', '/dashboard', '/checklists', '/manutencao', '/veiculos']

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const driverDomain = isDriverDomain(request)

  const isPublicRoute =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/offline') ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/app/login') ||
    pathname.startsWith('/login')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // No domínio do PWA: redirecionar raiz para /app/login
  if (driverDomain && !pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/login'
    return NextResponse.redirect(url)
  }

  const rawSession = request.cookies.get('fleetflow-session')?.value
  const session    = parseSession(rawSession)

  // Sem sessão → login correto para o domínio
  if (!session) {
    const url = request.nextUrl.clone()
    url.pathname = driverDomain ? '/app/login' : '/login'
    return NextResponse.redirect(url)
  }

  // Motorista tentando acessar rotas admin → redireciona para /app/home
  if (session.perfil === 'motorista' && !pathname.startsWith('/app')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/home'
    return NextResponse.redirect(url)
  }

  // Todos os outros perfis (gestor, analista, diretor) podem acessar /app/* E admin
  // Não há bloqueio adicional — o acesso é controlado pelas telas_permitidas no DB

  return NextResponse.next()
}
