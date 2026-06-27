/**
 * Parser error database yang tahan terhadap driver adapter.
 *
 * Penting: dengan `@prisma/adapter-mariadb`, error P2002/P2003 TIDAK mengisi
 * `meta.target` seperti engine native Prisma. Info constraint justru ada di
 * `meta.driverAdapterError.cause` (sudah diverifikasi via reproduksi DB):
 *
 *   Unique (P2002):
 *     cause.kind = 'UniqueConstraintViolation'
 *     cause.constraint.index = 'employee_noKtp_key'
 *
 *   Foreign key (P2003):
 *     cause.kind = 'ForeignKeyConstraintViolation'
 *     cause.constraint.fields = ['cabang']
 *
 * Helper ini membaca semua kemungkinan lokasi (adapter + engine native) agar
 * deteksi unique/FK konsisten di mana pun dipakai.
 */

type DbErrorKind = 'unique' | 'fk' | 'other'

interface ParsedDbError {
  code: string | undefined
  kind: DbErrorKind
  /** Nama index/kolom/constraint atau pesan asli, sudah lowercase */
  constraint: string
}

interface AdapterCause {
  kind?: string
  originalMessage?: string
  constraint?: { index?: string; fields?: string[] }
}

export function parseDbError(error: unknown): ParsedDbError {
  const e = error as {
    code?: string
    meta?: { target?: unknown; driverAdapterError?: { cause?: AdapterCause } }
  }
  const code = e?.code
  const cause = e?.meta?.driverAdapterError?.cause

  const constraintParts = [
    cause?.constraint?.index,
    ...(Array.isArray(cause?.constraint?.fields) ? cause!.constraint!.fields! : []),
    cause?.originalMessage,
    Array.isArray(e?.meta?.target) ? (e!.meta!.target as string[]).join(',') : (e?.meta?.target as string | undefined),
  ].filter(Boolean)
  const constraint = constraintParts.join(' ').toLowerCase()

  let kind: DbErrorKind = 'other'
  if (code === 'P2002' || cause?.kind === 'UniqueConstraintViolation') kind = 'unique'
  else if (code === 'P2003' || cause?.kind === 'ForeignKeyConstraintViolation') kind = 'fk'

  return { code, kind, constraint }
}

/** True jika error adalah pelanggaran unique. `field` opsional untuk mempersempit ke kolom tertentu. */
export function isUniqueViolation(error: unknown, field?: string): boolean {
  const p = parseDbError(error)
  if (p.kind !== 'unique') return false
  return field ? p.constraint.includes(field.toLowerCase()) : true
}

/** True jika error adalah pelanggaran foreign key. `field` opsional untuk mempersempit ke kolom tertentu. */
export function isForeignKeyViolation(error: unknown, field?: string): boolean {
  const p = parseDbError(error)
  if (p.kind !== 'fk') return false
  return field ? p.constraint.includes(field.toLowerCase()) : true
}
