import 'server-only'
import { verifySession } from './dal'
import { fail, type ActionResult } from './result'
import { hasPermission, PERMISSIONS, type Permission } from './permissions'

// Matrix permission dipindah ke ./permissions (client-safe). Re-export di sini
// untuk kompatibilitas import lama.
export { hasPermission, PERMISSIONS, type Permission }

type SessionUser = Awaited<ReturnType<typeof verifySession>>
type GuardResult = { session: SessionUser; denied: null } | { session: null; denied: ActionResult<never> }

function deny(message = 'Akses ditolak.'): never {
  throw Object.assign(new Error(message), { code: 'UNAUTHORIZED' })
}

// ─── Guards ───────────────────────────────────────────────────────────────────

export async function requireAuth() {
  return await verifySession()
}

/** Requires ADMIN role. Throws on failure. */
export async function requireAdmin() {
  const session = await verifySession()
  if (!hasPermission(session.role, 'user_manage')) {
    deny('Akses ditolak. Diperlukan izin Administrator.')
  }
  return session
}

/** Requires any role that can manage employees. Throws on failure. */
export async function requireHR() {
  const session = await verifySession()
  if (!hasPermission(session.role, 'employee_create')) {
    deny('Akses ditolak. Diperlukan izin HR.')
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

/** Returns ActionResult.fail instead of throwing - for actions that return values. */
export async function guardAdmin(): Promise<GuardResult> {
  const session = await verifySession()
  if (!hasPermission(session.role, 'user_manage')) {
    return { session: null, denied: fail('Akses ditolak.', 'UNAUTHORIZED') }
  }
  return { session, denied: null }
}

export async function guardPermission(permission: Permission): Promise<GuardResult> {
  const session = await verifySession()
  if (!hasPermission(session.role, permission)) {
    return { session: null, denied: fail('Akses ditolak.', 'UNAUTHORIZED') }
  }
  return { session, denied: null }
}
