import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter for login brute-force protection.
// Single-instance only — use Redis for multi-instance deployments.
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return true
  }

  if (entry.count >= LOGIN_LIMIT) return false

  entry.count++
  return true
}

export default withAuth(
  function middleware(req: NextRequest) {
    // Rate-limit the login POST only
    if (req.nextUrl.pathname === '/api/auth/callback/credentials' && req.method === 'POST') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      if (!checkRateLimit(ip)) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token
      },
    },
    pages: { signIn: '/login' },
  }
)

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon\\.ico).*)'],
}
