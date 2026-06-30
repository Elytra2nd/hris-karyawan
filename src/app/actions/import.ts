'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addMonths, subDays, format } from 'date-fns'
import { requirePermission } from "@/lib/auth-guard"
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { isUniqueViolation } from '@/lib/prisma-error'
import { importEmployeeSchema } from '@/lib/validation'
import { normalizeRow } from '@/lib/import-utils'

// Batas baris per import - cegah payload raksasa / memory spike. Dinaikkan ke
// 5000 agar muat data historis (riwayat kontrak = banyak baris/orang). Fitur
// admin-only (requirePermission), jadi risiko abuse rendah.
const MAX_IMPORT_ROWS = 5000

export interface ImportRow {
  index: number
  raw: Record<string, string>
}

export interface ImportResult {
  created: number          // jumlah karyawan baru dibuat
  contractsAdded: number   // jumlah periode kontrak ditambahkan
  skipped: number          // jumlah baris dilewati karena error
  errors: { row: number; message: string }[]
}

// Baris yang sudah lolos validasi + resolusi cabang/posisi, siap dikelompokkan.
interface PreparedRow {
  index: number
  ktp: string
  // identitas karyawan (konstan per KTP)
  cabang: string
  baCabang: string
  region: string | null
  namaLengkap: string
  nik: string | null
  noJamsostek: string | null
  tglLahir: Date | null
  namaIbu: string
  noHp: string | null
  formConsent: string | null
  gender: string | null
  // satu periode kontrak (bisa banyak per KTP)
  posisi: string
  traineeSejak: Date
  traineeSelesai: Date
  contractNumber: string | null
}

// Kunci unik 1 periode kontrak (untuk dedupe saat re-import file yang sama).
const contractKey = (posisi: string, traineeSejak: Date) =>
  `${posisi}|${format(traineeSejak, 'yyyy-MM-dd')}`

// ─── Bulk Import Server Action ────────────────────────────────────────────────
// Data sumber = SATU BARIS PER PERIODE KONTRAK (No KTP berulang untuk
// perpanjangan). Maka baris dikelompokkan per KTP: 1 karyawan + banyak kontrak.
export async function bulkImportEmployees(
  rows: ImportRow[]
): Promise<ImportResult> {
  const session = await requirePermission('import_data')

  const result: ImportResult = { created: 0, contractsAdded: 0, skipped: 0, errors: [] }

  // Tolak payload yang melebihi batas - cegah DoS via array raksasa.
  if (rows.length > MAX_IMPORT_ROWS) {
    result.errors.push({
      row: 0,
      message: `File terlalu besar - maksimal ${MAX_IMPORT_ROWS} baris per impor (file berisi ${rows.length} baris)`,
    })
    result.skipped = rows.length
    return result
  }

  // Pre-fetch Branch (validasi cabang + derive BA Cabang) & Position (durasi).
  const [allBranches, allPositions] = await Promise.all([
    prisma.branch.findMany({ select: { code: true, label: true } }),
    prisma.position.findMany({ select: { name: true, contractMonths: true } }),
  ])
  const branchByCode = new Map(allBranches.map(b => [b.code.toUpperCase(), b]))
  const branchByLabel = new Map(allBranches.map(b => [b.label.toUpperCase(), b]))
  const monthsByPosisi = new Map(allPositions.map(p => [p.name.toUpperCase(), p.contractMonths]))

  // Resolusi cabang yang toleran: coba tiap kandidat (kolom CABANG lalu BA),
  // cocokkan ke kode (H721) ATAU nama cabang (KETAPANG). Mengatasi file yang
  // menaruh kode di kolom BA dan region/kota di kolom CABANG.
  const resolveBranch = (...candidates: (string | null | undefined)[]) => {
    for (const c of candidates) {
      if (!c) continue
      const up = c.toUpperCase().trim()
      const hit = branchByCode.get(up) ?? branchByLabel.get(up)
      if (hit) return hit
    }
    return undefined
  }

  // ── Tahap 1: validasi + resolusi tiap baris → PreparedRow ──
  const prepared: PreparedRow[] = []
  for (const { index, raw } of rows) {
    const normalized = normalizeRow(raw)

    const parsed = importEmployeeSchema.safeParse(normalized)
    if (!parsed.success) {
      result.errors.push({ row: index + 1, message: parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap' })
      result.skipped++
      continue
    }

    const {
      cabang, ba, baCabang: baCabangCol, region, namaLengkap, nik, noKtp,
      tglLahir, namaIbu, noHp, noJamsostek, formConsent, gender, posisi,
      traineeSejak, traineeSelesai, contractNumber,
    } = parsed.data

    // Coba semua kandidat: kode (BA/CABANG) lalu nama cabang (BA CABANG).
    const branch = resolveBranch(cabang, ba, baCabangCol)
    if (!branch) {
      result.errors.push({ row: index + 1, message: `Cabang "${cabang}" tidak terdaftar - tambahkan dulu di Kelola Cabang` })
      result.skipped++
      continue
    }

    const months = monthsByPosisi.get(posisi.toUpperCase())
    if (months === undefined) {
      result.errors.push({ row: index + 1, message: `Posisi "${posisi}" tidak terdaftar - tambahkan dulu di Kelola Posisi` })
      result.skipped++
      continue
    }

    const sejak = new Date(traineeSejak)
    // Pakai tanggal selesai dari file kalau ada; kalau kosong, hitung dari durasi
    // posisi (hari terakhir inklusif: +N bulan lalu mundur 1 hari).
    let selesai: Date
    if (traineeSelesai) {
      selesai = new Date(traineeSelesai)
      // Tolak tanggal selesai mendahului tanggal mulai (salah ketik di file) -
      // jangan diam-diam simpan kontrak berdurasi negatif.
      if (selesai < sejak) {
        result.errors.push({ row: index + 1, message: `Tanggal selesai (${traineeSelesai}) lebih awal dari tanggal mulai (${traineeSejak}) - perbaiki di file` })
        result.skipped++
        continue
      }
    } else {
      selesai = subDays(addMonths(sejak, months), 1)
    }

    // Kalau kolom CABANG ternyata berisi region (bukan kode/nama cabang yang
    // cocok), pakai nilainya sebagai region.
    const cabangUp = cabang.toUpperCase().trim()
    const cabangIsRegion = cabangUp !== branch.code.toUpperCase() && cabangUp !== branch.label.toUpperCase()

    prepared.push({
      index, ktp: noKtp,
      cabang: branch.code, baCabang: branch.label,
      region: region ?? (cabangIsRegion ? cabang : null),
      namaLengkap, nik: nik ?? null, noJamsostek: noJamsostek ?? null,
      tglLahir: tglLahir ? new Date(tglLahir) : null,
      namaIbu, noHp: noHp ?? null, formConsent: formConsent ?? null,
      gender: gender ?? null,
      posisi, traineeSejak: sejak, traineeSelesai: selesai,
      contractNumber: contractNumber ?? null,
    })
  }

  if (prepared.length === 0) return result

  // ── Tahap 2: kelompokkan per KTP (urutan kemunculan dipertahankan) ──
  const groups = new Map<string, PreparedRow[]>()
  for (const p of prepared) {
    const g = groups.get(p.ktp)
    if (g) g.push(p)
    else groups.set(p.ktp, [p])
  }

  // Pre-fetch karyawan yang sudah ada (+ kontraknya) untuk dedupe.
  const existing = await prisma.employee.findMany({
    where: { noKtp: { in: [...groups.keys()] } },
    select: { id: true, noKtp: true, contracts: { select: { posisi: true, traineeSejak: true } } },
  })
  const existingByKtp = new Map(existing.map(e => [e.noKtp, e]))

  // Ambil nilai identitas pertama yang tidak kosong dalam grup (data historis
  // sering tersebar: No HP ada di baris ke-5, dst).
  const firstNonNull = <K extends keyof PreparedRow>(g: PreparedRow[], key: K): PreparedRow[K] => {
    for (const r of g) if (r[key] != null && r[key] !== '') return r[key]
    return g[0][key]
  }

  // ── Tahap 3: buat/lengkapi karyawan + kontrak per grup ──
  for (const [ktp, g] of groups) {
    const head = g[0]
    const existingEmp = existingByKtp.get(ktp)

    // Kontrak yang sudah ada (dedupe re-import) + yang sudah dibuat di grup ini.
    const seen = new Set<string>(
      existingEmp?.contracts.map(c => contractKey(c.posisi, new Date(c.traineeSejak))) ?? []
    )
    const newContracts = g
      .filter(r => {
        const key = contractKey(r.posisi, r.traineeSejak)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .map(r => ({ posisi: r.posisi, traineeSejak: r.traineeSejak, traineeSelesai: r.traineeSelesai, contractNumber: r.contractNumber }))

    try {
      if (existingEmp) {
        // Karyawan sudah ada → cukup tambah periode kontrak baru.
        if (newContracts.length > 0) {
          await prisma.contract.createMany({
            data: newContracts.map(c => ({ ...c, employeeId: existingEmp.id })),
          })
          result.contractsAdded += newContracts.length
          await createAuditLog(
            session.id, session.username, 'UPDATE', 'employee', existingEmp.id,
            { source: 'bulk_import', action: 'add_contracts', nama: head.namaLengkap, jumlahKontrak: newContracts.length }
          )
        }
      } else {
        // Karyawan baru → buat identitas + semua kontraknya sekaligus (atomik).
        const emp = await prisma.employee.create({
          data: {
            ba: head.cabang, baCabang: head.baCabang, region: firstNonNull(g, 'region'),
            cabang: head.cabang, namaLengkap: head.namaLengkap, status: 'AKTIF',
            nik: firstNonNull(g, 'nik'), noJamsostek: firstNonNull(g, 'noJamsostek'),
            noKtp: ktp, tglLahir: firstNonNull(g, 'tglLahir'), namaIbu: head.namaIbu,
            noHp: firstNonNull(g, 'noHp'), formConsent: firstNonNull(g, 'formConsent'),
            gender: firstNonNull(g, 'gender'),
            contracts: { create: newContracts },
          },
        })
        result.created++
        result.contractsAdded += newContracts.length
        await createAuditLog(
          session.id, session.username, 'CREATE', 'employee', emp.id,
          { source: 'bulk_import', nama: head.namaLengkap, cabang: head.cabang, jumlahKontrak: newContracts.length }
        )
      }
    } catch (error) {
      let message = 'Kami belum bisa menyimpan data ini - coba impor ulang'
      if (isUniqueViolation(error, 'noKtp')) message = `No KTP ${ktp} sudah terdaftar - baris dilewati`
      else logger.error('bulkImport group failed', { ktp, error: String(error) })
      // Tandai semua baris grup ini sebagai gagal.
      for (const r of g) {
        result.errors.push({ row: r.index + 1, message })
        result.skipped++
      }
    }
  }

  if (result.created > 0 || result.contractsAdded > 0) {
    revalidatePath('/')
    revalidatePath('/karyawan')
  }

  return result
}
