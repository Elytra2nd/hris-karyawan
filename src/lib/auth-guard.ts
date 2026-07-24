import 'server-only'
import { verifySession } from './dal'
import { hasPermission, PERMISSIONS, type Permission } from './permissions'

// Matrix permission dipindah ke ./permissions (client-safe). Re-export di sini
// untuk kompatibilitas import lama.
export { hasPermission, PERMISSIONS, type Permission }

function deny(message = 'Akses ditolak.'): never {
  throw Object.assign(new Error(message), { code: 'UNAUTHORIZED' })
}

// ─── Guards ───────────────────────────────────────────────────────────────────

export async function requireAuth() {
  const session = await verifySession()
  // Akun yang sudah dihapus admin (ditandai saat refresh JWT) ditolak total.
  if (session.role === '__deleted__') {
    deny('Akun Anda sudah tidak aktif. Silakan hubungi Administrator.')
  }
  return session
}

/** Requires ADMIN role. Throws on failure. */
export async function requireAdmin() {
  const session = await verifySession()
  if (!hasPermission(session.role, 'user_manage')) {
    deny('Akses ditolak. Diperlukan izin Administrator.')
  }
  return session
}

/** Requires specific permission. Throws on failure. */
export async function requirePermission(permission: Permission) {
  const session = await verifySession()
  if (!hasPermission(session.role, permission)) {
    deny(`Akses ditolak: izin '${permission}' diperlukan.`)
  }
  return session
}
