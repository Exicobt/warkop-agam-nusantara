import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth' 

export async function middleware(request) {
  const tokenCookie = await request.cookies.get('token')
  const token = tokenCookie?.value

  const { pathname } = request.nextUrl

  const protectedRoutes = ['/dashboard', '/dapur']

  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    try {
      const decoded = await verifyToken(token)
      const userRole = decoded.role

      if (pathname.startsWith('/dashboard') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (pathname.startsWith('/dapur') && userRole !== 'dapur') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('user-data', JSON.stringify(decoded))

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.error('Token verification failed:', error)
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (pathname === '/' && token) {
    try {
      const decoded = await verifyToken(token)
      return NextResponse.redirect(new URL(`/${decoded.role === 'admin' ? 'dashboard' : decoded.role}`, request.url))
    } catch {
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}


export const config = {
  matcher: [
    '/', // Tambahin ini biar halaman '/' ikut dimiddleware-in
    '/((?!_next/static|_next/image|favicon.ico|images).*)'
  ]
}