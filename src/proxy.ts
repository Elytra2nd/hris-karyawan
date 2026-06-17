import { withAuth } from 'next-auth/middleware'

// Catatan: rate-limit login di-handle di authorize() (src/lib/auth.ts),
// karena matcher di bawah meng-exclude `api/auth` - middleware tidak pernah
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
  // Kecualikan halaman publik, endpoint auth, dan aset statis (gambar/font di /public).
  // Tanpa pengecualian ekstensi, request logo & font Satoshi ikut kena auth → redirect ke
  // /login saat belum login (logo broken, font fallback). File di /api/files tetap aman
  // karena route-nya melakukan cek sesi sendiri.
  matcher: [
    '/((?!login|api/auth|api/health|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf)$).*)',
  ],
}
