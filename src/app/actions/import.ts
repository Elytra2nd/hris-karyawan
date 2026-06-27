'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addMonths } from 'date-fns'
import { requirePermission } from "@/lib/auth-guard"
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { isUniqueViolation, isForeignKeyViolation } from '@/lib/prisma-error'
import { createEmployeeSchema } from '@/lib/validation'
import { normalizeRow } from '@/lib/import-utils'

// Batas baris per import - cegah payload raksasa / memory spike (DoS).
const MAX_IMPORT_ROWS = 1000

export interface ImportRow {
  index: number
  raw: Record<string, string>
}

export interface ImportResult {
  created: number
  skipped: number
  errors: { row: number; message: string }[]
}

// ─── Bulk Import Server Action ────────────────────────────────────────────────
export async function bulkImportEmployees(
  rows: ImportRow[]
): Promise<ImportResult> {
  const session = await requirePermission('import_data')

  const result: ImportResult = { created: 0, skipped: 0, errors: [] }

  // Tolak payload yang melebihi batas - cegah DoS via array raksasa.
  if (rows.length > MAX_IMPORT_ROWS) {
    result.errors.push({
      row: 0,
      message: `File terlalu besar - maksimal ${MAX_IMPORT_ROWS} baris per impor (file berisi ${rows.length} baris)`,
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

  // Pre-fetch semua departemen untuk resolve kode → ID
  const allDepartments = await prisma.department.findMany({
    select: { id: true, code: true, name: true },
  })
  const deptByCode = new Map(allDepartments.map(d => [d.code.toUpperCase(), d.id]))
  const deptByName = new Map(allDepartments.map(d => [d.name.toUpperCase(), d.id]))

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
      nik, noKtp, tglLahir: tglLahirRaw, namaIbu, noHp,
      noJamsostek, formConsent, posisi, traineeSejak: traineeSejakRaw,
    } = parsed.data

    // @db.Date di Prisma butuh objek Date, bukan string "yyyy-MM-dd"
    const tglLahir = new Date(tglLahirRaw)

    // Skip duplikat KTP (sudah di DB atau duplikat dalam file ini)
    if (existingKtp.has(noKtp) || seenInBatch.has(noKtp)) {
      result.errors.push({ row: index + 1, message: `No KTP ${noKtp} sudah terdaftar - baris dilewati` })
      result.skipped++
      continue
    }
    seenInBatch.add(noKtp)

    const traineeSejak = new Date(traineeSejakRaw)
    const traineeSelesai = posisi.toLowerCase().includes('admin')
      ? addMonths(traineeSejak, 3)
      : addMonths(traineeSejak, 6)

    try {
      // Resolve departmentCode (bisa berupa kode atau nama departemen)
      const deptCode = normalized.departmentCode?.toString().toUpperCase() ?? ''
      let departmentId: string | null = null
      if (deptCode) {
        departmentId = deptByCode.get(deptCode) ?? deptByName.get(deptCode) ?? null
      }

      const emp = await prisma.employee.create({
        data: {
          ba, baCabang, cabang, namaLengkap,
          status: 'AKTIF',
          nik: nik ?? null,
          noJamsostek: noJamsostek ?? null,
          noKtp, tglLahir, namaIbu, noHp, formConsent,
          departmentId,
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
      let message = 'Kami belum bisa menyimpan baris ini - coba impor ulang'
      if (isUniqueViolation(error, 'noKtp')) message = `No KTP ${noKtp} sudah terdaftar - baris dilewati`
      else if (isForeignKeyViolation(error, 'cabang')) message = `Cabang "${cabang}" tidak terdaftar - tambahkan dulu di Kelola Cabang`
      else logger.error('bulkImport row failed', { row: index + 1, error: String(error) })
      result.errors.push({ row: index + 1, message })
      result.skipped++
    }
  }

  if (result.created > 0) {
    revalidatePath('/')
    revalidatePath('/karyawan')
  }

  return result
}
