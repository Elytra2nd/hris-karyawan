// Matrix permission — client-safe (TIDAK server-only) agar bisa dipakai untuk
// gating UI di Client Component sekaligus jadi sumber kebenaran untuk guard di
// server (auth-guard.ts re-export dari sini). Jangan taruh logika sesi di sini.

export const PERMISSIONS = {
  // Employee operations
  employee_read:   ['ADMIN', 'HR_MANAGER', 'HR_STAFF', 'VIEWER'],
  employee_create: ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
  employee_update: ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
  employee_delete: ['ADMIN', 'HR_MANAGER'],

  // Contract operations
  contract_create: ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],

  // User management (admin panel)
  user_manage:     ['ADMIN'],

  // Audit log
  audit_read:      ['ADMIN', 'HR_MANAGER'],

  // Position management
  position_manage: ['ADMIN', 'HR_MANAGER'],

  // Export / import
  export_data:     ['ADMIN', 'HR_MANAGER'],
  import_data:     ['ADMIN', 'HR_MANAGER'],

  // File upload (profile photo)
  upload_photo:    ['ADMIN', 'HR_MANAGER', 'HR_STAFF'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false
  const allowed = PERMISSIONS[permission] as readonly string[]
  return allowed.includes(role)
}
