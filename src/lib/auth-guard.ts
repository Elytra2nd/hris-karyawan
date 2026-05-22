import 'server-only'
import { verifySession } from './dal'
import { fail } from './result'

/**
 * Verifikasi session ada dan return user.
 * Jika tidak ada session → redirect ke /login (handled oleh verifySession).
 */
export async function requireAuth() {
  return await verifySession()
}

/**
 * Verifikasi session dan pastikan role = ADMIN.
 * Throw error kalau bukan Admin — tangkap di action dengan try/catch.
 */
export async function requireAdmin() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') {
    throw Object.assign(new Error('Akses ditolak. Diperlukan izin Administrator.'), {
      code: 'UNAUTHORIZED',
    })
  }
  return session
}

/**
 * Verifikasi session dan pastikan role = ADMIN.
 * Return ActionResult.fail jika bukan Admin — gunakan di actions yang return value.
 */
export async function guardAdmin() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') {
    return { session: null, denied: fail('Akses ditolak.', 'UNAUTHORIZED') as any }
  }
  return { session, denied: null }
}
