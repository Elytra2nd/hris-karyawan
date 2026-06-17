'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addMonths, parse, isValid, format } from 'date-fns'
import { requirePermission } from "@/lib/auth-guard"
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { createEmployeeSchema } from '@/lib/validation'

// Batas baris per import — cegah payload raksasa / memory spike (DoS).
const MAX_IMPORT_ROWS = 1000

// ─── Column name → schema field mapping ──────────────────────────────────────
const COL_MAP: Record<string, string> = {
  'BA': 'ba',
  'BA CABANG': 'baCabang',
  'CABANG': 'cabang',
  'NAMA LENGKAP': 'namaLengkap',
  'NIK': 'nik',
  'NO KTP': 'noKtp',
  'TGL LAHIR': 'tglLahir',
  'NAMA IBU': 'namaIbu',
  'NO HP': 'noHp',
  'NO JAMSOSTEK': 'noJamsostek',
  'FORM CONSENT': 'formConsent',
  'POSISI': 'posisi',
  'TRAINEE SEJAK': 'traineeSejak',
}

export interface ImportRow {
  index: number
  raw: Record<string, string>
}

export interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
}

// ─── Parse various date formats ───────────────────────────────────────────────
function parseDate(raw: string): string | null {
  if (!raw || raw === '-') return null
  const trimmed = raw.trim()

  // dd.MM.yyyy
  const dotFmt = parse(trimmed, 'dd.MM.yyyy', new Date())
  if (isValid(dotFmt)) return format(dotFmt, 'yyyy-MM-dd')

  // dd/MM/yyyy
  const slashFmt = parse(trimmed, 'dd/MM/yyyy', new Date())
  if (isValid(slashFmt)) return format(slashFmt, 'yyyy-MM-dd')

  // yyyy-MM-dd (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  return null
}

function normalizeRow(raw: Record<string, string>): Record<string, string | null> {
  const normalized: Record<string, string | null> = {}
  for (const [col, val] of Object.entries(raw)) {
    const field = COL_MAP[col.toUpperCase().trim()]
    if (!field) continue
    const v = val?.toString().trim() ?? ''

    if (field === 'tglLahir' || field === 'traineeSejak') {
      normalized[field] = parseDate(v)
    } else if (field === 'nik' || field === 'noJamsostek') {
      normalized[field] = v === '-' || v === '' ? null : v
    } else {
      normalized[field] = v === '-' || v === '' ? null : v
    }
  }
  return normalized
}

// ─── Bulk Import Server Action ────────────────────────────────────────────────
export async function bulkImportEmployees(
  rows: ImportRow[]
): Promise<ImportResult> {
  const session = await requirePermission('import_data')

  const result: ImportResult = { created: 0, skipped: 0, errors: [] }

  // Tolak payload yang melebihi batas — cegah DoS via array raksasa.
  if (rows.length > MAX_IMPORT_ROWS) {
    result.errors.push({
      row: 0,
      message: `File terlalu besar — maksimal ${MAX_IMPORT_ROWS} baris per impor (file berisi ${rows.length} baris)`,
    })
    result.skipped = rows.length
    return result
  }

  // Pre-fetch semua KTP yang sudah ada dalam SATU query (hindari N+1).
  const candidateKtp = rows
    .map(r => normalizeRow(r.raw).noKtp)
    .filter((k): k is string => !!k)
  const existingKtp = new Set(
    (
      await prisma.employee.findMany({
        where: { noKtp: { in: candidateKtp } },
        select: { noKtp: true },
      })
    ).map(e => e.noKtp)
  )
  // Lacak KTP duplikat di dalam file yang sama juga.
  const seenInBatch = new Set<string>()

  for (const { index, raw } of rows) {
    const normalized = normalizeRow(raw)

    const parsed = createEmployeeSchema.safeParse(normalized)
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap'
      result.errors.push({ row: index + 1, message: msg })
      result.skipped++
      continue
    }

    const {
      ba, baCabang, cabang, namaLengkap,
      nik, noKtp, tglLahir, namaIbu, noHp,
      noJamsostek, formConsent, posisi, traineeSejak: traineeSejakRaw,
    } = parsed.data

    // Skip duplikat KTP (sudah di DB atau duplikat dalam file ini)
    if (existingKtp.has(noKtp) || seenInBatch.has(noKtp)) {
      result.errors.push({ row: index + 1, message: `No KTP ${noKtp} sudah terdaftar — baris dilewati` })
      result.skipped++
      continue
    }
    seenInBatch.add(noKtp)

    const traineeSejak = new Date(traineeSejakRaw)
    const traineeSelesai = posisi.toLowerCase().includes('admin')
      ? addMonths(traineeSejak, 3)
      : addMonths(traineeSejak, 6)

    try {
      const emp = await prisma.employee.create({
        data: {
          ba, baCabang, cabang, namaLengkap,
          status: 'AKTIF',
          nik: nik ?? null,
          noJamsostek: noJamsostek ?? null,
          noKtp, tglLahir, namaIbu, noHp, formConsent,
          contracts: { create: { posisi, traineeSejak, traineeSelesai } },
        },
      })

      await createAuditLog(
        session.id,
        session.username,
        'CREATE',
        'employee',
        emp.id,
        { source: 'bulk_import', nama: namaLengkap, cabang, posisi }
      )

      result.created++
    } catch (error) {
      logger.error('bulkImport row failed', { row: index + 1, error: String(error) })
      result.errors.push({ row: index + 1, message: 'Kami belum bisa menyimpan baris ini — coba impor ulang' })
      result.skipped++
    }
  }

  if (result.created > 0) {
    revalidatePath('/')
    revalidatePath('/karyawan')
  }

  return result
}
