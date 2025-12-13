import { NextResponse } from 'next/server'

export async function middleware(request) {
  const tokenCookie = request.cookies.get('token')
  const token = tokenCookie ? JSON.parse(tokenCookie.value) : null

  const { pathname } = request.nextUrl

  const protectedRoutes = ['/dashboard', '/dapur']

  if (protectedRoutes.some(r => pathname.startsWith(r))) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const userRole = token.role

    if (pathname.startsWith('/dashboard') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/dapur') && userRole !== 'dapur') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    if (pathname.startsWith('/cashier') && userRole !== 'kasir') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    return NextResponse.next()
  }

  // kalo user udah login, redirect ke dashboard sesuai role
  if (pathname === '/' && token) {
    return NextResponse.redirect(
      new URL(token.role === 'admin' ? '/dashboard' : ( token.role === 'kasir' ? '/cashier' : '/dapur' ), request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/((?!_next/static|_next/image|favicon.ico|images).*)'
  ]
}
