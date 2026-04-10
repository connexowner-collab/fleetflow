import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/offline')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  const session = request.cookies.get('fleetflow-session')

  if (!session?.value) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
