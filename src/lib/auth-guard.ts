import 'server-only'
import { verifySession } from './dal'
import { fail, type ActionResult } from './result'
import type { AppRole } from './validation'

type SessionUser = Awaited<ReturnType<typeof verifySession>>
type GuardResult = { session: SessionUser; denied: null } | { session: null; denied: ActionResult<never> }

// ─── Permission Matrix ────────────────────────────────────────────────────────
// Define exactly what each role can do. Extend here as roles grow.
const PERMISSIONS = {
  // Employee operations
  employee_read:        ['ADMIN', 'HR_MANAGER', 'HR_STAFF', 'VIEWER'],
  employee_create:      ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
  employee_update:      ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
  employee_delete:      ['ADMIN', 'HR_MANAGER'],

  // Contract operations
  contract_create:      ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],

  // User management (admin panel)
  user_manage:          ['ADMIN'],

  // Audit log
  audit_read:           ['ADMIN', 'HR_MANAGER'],

  // Department management
  department_manage:    ['ADMIN'],

  // Export / import
  export_data:          ['ADMIN', 'HR_MANAGER'],
  import_data:          ['ADMIN', 'HR_MANAGER'],

  // File upload (profile photo)
  upload_photo:         ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: string, permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly string[]
  return allowed.includes(role)
}

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
