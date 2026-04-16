import { NextResponse, type NextRequest } from 'next/server'

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

  const session = request.cookies.get('fleetflow-session')

  if (!session?.value) {
    const url = request.nextUrl.clone()
    // APP routes → redirect to /app/login
    url.pathname = pathname.startsWith('/app') ? '/app/login' : '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
