/**
 * Unified ActionResult type untuk semua server actions.
 * Gunakan ini sebagai return type agar response konsisten.
 */

export type ActionCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'SERVER_ERROR'

export type ActionResult<T = void> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code: ActionCode; fields?: Record<string, string> }

// ─── Helper builders ──────────────────────────────────────────────────────────

export function ok<T = void>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message }
}

export function fail(
  error: string,
  code: ActionCode = 'SERVER_ERROR',
  fields?: Record<string, string>
): ActionResult<never> {
  return { success: false, error, code, fields }
}

export function validationFail(
  fields: Record<string, string>
): ActionResult<never> {
  const first = Object.values(fields)[0]
  return {
    success: false,
    error: first ?? 'Ada isian yang belum lengkap',
    code: 'VALIDATION',
    fields,
  }
}
