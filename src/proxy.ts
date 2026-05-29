import { withAuth } from 'next-auth/middleware'

// Catatan: rate-limit login di-handle di authorize() (src/lib/auth.ts),
// karena matcher di bawah meng-exclude `api/auth` — middleware tidak pernah
// jalan untuk request login.
export default withAuth({
  callbacks: {
    authorized({ token }) {
      return !!token
    },
  },
  pages: { signIn: '/login' },
})

export const config = {
  matcher: ['/((?!login|api/auth|api/health|_next/static|_next/image|favicon\\.ico).*)'],
}
