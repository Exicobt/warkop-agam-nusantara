import { NextResponse } from 'next/server'

export async function middleware(request) {
  const tokenCookie = request.cookies.get('token')
  let token = null

  // Aman parsing cookie
  try {
    if (tokenCookie) token = JSON.parse(tokenCookie.value)
  } catch (err) {
    token = null
  }

  const { pathname } = request.nextUrl

  // Protected routes berdasarkan role
  const roleRoutes = {
    admin: ['/dashboard'],
    kasir: ['/cashier'],
    dapur: ['/dapur'],
  }

  // Cek kalau route membutuhkan role
  for (const [role, routes] of Object.entries(roleRoutes)) {
    if (routes.some(route => pathname.startsWith(route))) {
      // Kalau ga ada token, redirect ke login
      if (!token) {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Kalau role salah, redirect ke unauthorized
      if (token.role !== role) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      return NextResponse.next()
    }
  }

  // Kalau user udah login dan ke '/', redirect sesuai role
  if (pathname === '/' && token) {
    let redirectUrl = '/'
    if (token.role === 'admin') redirectUrl = '/dashboard'
    else if (token.role === 'kasir') redirectUrl = '/cashier'
    else if (token.role === 'dapur') redirectUrl = '/dapur'

    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  // Route bebas, lanjut
  return NextResponse.next()
}

// Batasi matcher hanya ke route penting
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/dapur/:path*',
    '/cashier/:path*',
  ]
}
