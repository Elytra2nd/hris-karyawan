'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addMonths, subDays } from 'date-fns'
import { requirePermission } from "@/lib/auth-guard"
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { isUniqueViolation } from '@/lib/prisma-error'
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

  // Pre-fetch Branch (untuk derive BA/BA Cabang + validasi cabang) & Position (durasi)
  const [allBranches, allPositions] = await Promise.all([
    prisma.branch.findMany({ select: { code: true, label: true } }),
    prisma.position.findMany({ select: { name: true, contractMonths: true } }),
  ])
  const branchByCode = new Map(allBranches.map(b => [b.code.toUpperCase(), b]))
  const monthsByPosisi = new Map(allPositions.map(p => [p.name.toUpperCase(), p.contractMonths]))

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
      cabang, namaLengkap,
      nik, noKtp, tglLahir: tglLahirRaw, namaIbu, noHp,
      noJamsostek, formConsent, posisi, traineeSejak: traineeSejakRaw,
    } = parsed.data

    // Validasi cabang + derive BA/BA Cabang dari Branch
    const branch = branchByCode.get(cabang.toUpperCase())
    if (!branch) {
      result.errors.push({ row: index + 1, message: `Cabang "${cabang}" tidak terdaftar - tambahkan dulu di Kelola Cabang` })
      result.skipped++
      continue
    }
    // Validasi posisi terhadap tabel Position
    const months = monthsByPosisi.get(posisi.toUpperCase())
    if (months === undefined) {
      result.errors.push({ row: index + 1, message: `Posisi "${posisi}" tidak terdaftar - tambahkan dulu di Kelola Posisi` })
      result.skipped++
      continue
    }

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
    // Hari terakhir periode (inklusif): +N bulan lalu mundur 1 hari
    const traineeSelesai = subDays(addMonths(traineeSejak, months), 1)

    try {
      const emp = await prisma.employee.create({
        data: {
          ba: branch.code, baCabang: branch.label, cabang: branch.code, namaLengkap,
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
        { source: 'bulk_import', nama: namaLengkap, cabang: branch.code, posisi }
      )

      result.created++
    } catch (error) {
      let message = 'Kami belum bisa menyimpan baris ini - coba impor ulang'
      if (isUniqueViolation(error, 'noKtp')) message = `No KTP ${noKtp} sudah terdaftar - baris dilewati`
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
