'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { differenceInDays, startOfDay } from 'date-fns'
import { calculateEndDate } from '@/lib/contract'
import { createAuditLog } from '@/lib/audit'
import { requirePermission, requireAuth } from '@/lib/auth-guard'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createContractSchema,
} from '@/lib/validation'
import { ok, fail, ActionResult } from '@/lib/result'
import { isUniqueViolation } from '@/lib/prisma-error'
import { logger } from '@/lib/logger'
import type { Prisma } from '@prisma/client'

// Durasi kontrak (bulan) dari tabel Position. null = posisi tak terdaftar.
async function getPositionMonths(posisi: string): Promise<number | null> {
  const pos = await prisma.position.findUnique({
    where: { name: posisi.toUpperCase() },
    select: { contractMonths: true },
  })
  return pos?.contractMonths ?? null
}

// ─── Create Employee ──────────────────────────────────────────────────────────
export async function createEmployee(data: Record<string, string | null>) {
  const session = await requirePermission('employee_create')
  const raw = data
  logger.info('createEmployee raw data received:', raw)

  const parsed = createEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    logger.warn('createEmployee validation failed:', { issues: parsed.error.issues, raw })
    const firstError = parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali formulir'
    return fail(firstError, 'VALIDATION')
  }

  const {
    cabang, namaLengkap,
    nik, noKtp, tglLahir: tglLahirRaw, namaIbu, noHp,
    noJamsostek, formConsent, gender, posisi, traineeSejak: traineeSejakRaw,
    contractNumber,
  } = parsed.data

  // BA & BA Cabang diturunkan dari Cabang (Branch). Sekaligus validasi cabang.
  const branch = await prisma.branch.findUnique({ where: { code: cabang.toUpperCase() } })
  if (!branch) {
    return fail(`Cabang "${cabang}" tidak terdaftar - pilih dari daftar atau tambahkan di Kelola Cabang`, 'VALIDATION', { cabang: 'Cabang tidak terdaftar' })
  }
  // Durasi kontrak dari tabel Position
  const months = await getPositionMonths(posisi)
  if (months === null) {
    return fail(`Posisi "${posisi}" tidak terdaftar - tambahkan dulu di Kelola Posisi`, 'VALIDATION', { posisi: 'Posisi tidak terdaftar' })
  }

  // @db.Date di Prisma butuh objek Date, bukan string "yyyy-MM-dd"
  const tglLahir = new Date(tglLahirRaw)
  const traineeSejak = new Date(traineeSejakRaw)
  const traineeSelesai = calculateEndDate(traineeSejak, months)

  let newEmployee
  try {
    newEmployee = await prisma.employee.create({
      data: {
        ba: branch.code, baCabang: branch.label, cabang: branch.code, namaLengkap,
        status: 'AKTIF',
        nik: nik ?? null,
        noJamsostek: noJamsostek ?? null,
        noKtp, tglLahir, namaIbu, noHp, formConsent,
        gender: gender ?? null,
        contracts: { create: { posisi, traineeSejak, traineeSelesai, contractNumber: contractNumber ?? null } },
      } satisfies Prisma.EmployeeUncheckedCreateInput,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    if (isUniqueViolation(error, 'noKtp')) {
      return fail(`No KTP ${noKtp} sudah terdaftar di sistem - gunakan nomor KTP lain`, 'DUPLICATE', { noKtp: 'No KTP ini sudah terdaftar' })
    }
    logger.error('createEmployee failed', { error: String(error) })
    return fail('Kami belum bisa menyimpan data - coba simpan ulang dalam beberapa saat', 'SERVER_ERROR')
  }

  await createAuditLog(
    session.id,
    session.username,
    'CREATE',
    'employee',
    newEmployee.id,
    { nama: namaLengkap, cabang, posisi }
  )

  revalidatePath('/')
  revalidatePath('/karyawan')
  return ok({ id: newEmployee.id })
}

// ─── Update Employee ──────────────────────────────────────────────────────────
export async function updateEmployee(id: string, data: Record<string, string | null>) {
  const session = await requirePermission('employee_update')
  const raw = data
  logger.info('updateEmployee raw data received:', { id, ...raw })

  const parsed = updateEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    logger.warn('updateEmployee validation failed:', { id, issues: parsed.error.issues, raw })
    return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali formulir', 'VALIDATION')
  }

  const {
    cabang, namaLengkap,
    nik, noKtp, tglLahir: tglLahirRaw, namaIbu, noHp,
    noJamsostek, formConsent, gender, status,
  } = parsed.data

  // BA & BA Cabang diturunkan dari Cabang (Branch). Sekaligus validasi cabang.
  const branch = await prisma.branch.findUnique({ where: { code: cabang.toUpperCase() } })
  if (!branch) {
    return fail(`Cabang "${cabang}" tidak terdaftar - pilih dari daftar atau tambahkan di Kelola Cabang`, 'VALIDATION', { cabang: 'Cabang tidak terdaftar' })
  }

  // @db.Date di Prisma butuh objek Date, bukan string "yyyy-MM-dd"
  const tglLahir = new Date(tglLahirRaw)

  // Ambil nilai lama untuk diff audit (sebelum → sesudah).
  const before = await prisma.employee.findFirst({
    where: { id, deletedAt: null },
    select: {
      cabang: true, namaLengkap: true, nik: true, noKtp: true, tglLahir: true,
      namaIbu: true, noHp: true, noJamsostek: true, formConsent: true, gender: true, status: true,
    },
  })
  if (!before) return fail('Data trainee tidak ditemukan atau sudah diarsipkan', 'NOT_FOUND')

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        ba: branch.code, baCabang: branch.label, cabang: branch.code, namaLengkap, status,
        nik: nik ?? null,
        noJamsostek: noJamsostek ?? null,
        noKtp, tglLahir, namaIbu, noHp, formConsent,
        gender: gender ?? null,
      } satisfies Prisma.EmployeeUncheckedUpdateInput,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    if (isUniqueViolation(error, 'noKtp')) {
      return fail(`No KTP ${noKtp} sudah digunakan trainee lain - gunakan nomor KTP berbeda`, 'DUPLICATE', { noKtp: 'No KTP ini sudah dipakai trainee lain' })
    }
    logger.error('updateEmployee failed', { id, error: String(error) })
    return fail('Kami belum bisa menyimpan perubahan - coba simpan ulang dalam beberapa saat', 'SERVER_ERROR')
  }

  // Hitung diff sebelum → sesudah untuk audit yang bisa dibaca manusia.
  const norm = (v: unknown): string => {
    if (v == null || v === '') return '—'
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    return String(v)
  }
  const after: Record<string, unknown> = {
    cabang: branch.code, namaLengkap, nik: nik ?? null, noKtp, tglLahir,
    namaIbu, noHp, noJamsostek: noJamsostek ?? null, formConsent, gender: gender ?? null, status,
  }
  const changes: Record<string, { from: string; to: string }> = {}
  for (const key of Object.keys(after)) {
    const from = norm((before as Record<string, unknown>)[key])
    const to = norm(after[key])
    if (from !== to) changes[key] = { from, to }
  }

  await createAuditLog(
    session.id,
    session.username,
    'UPDATE',
    'employee',
    id,
    { nama: namaLengkap, changes }
  )

  revalidatePath('/')
  revalidatePath('/karyawan')
  revalidatePath(`/karyawan/${id}`)
  return ok({ id })
}

// ─── Create Contract ──────────────────────────────────────────────────────────
export async function createContract(employeeId: string, data: Record<string, string | null>): Promise<ActionResult<{ employeeId: string }>> {
  try {
    const session = await requirePermission('contract_create')
    const raw = data

    const parsed = createContractSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian kontrak yang belum lengkap - periksa kembali', 'VALIDATION')
    }

    // Jangan izinkan tambah kontrak ke trainee yang sudah diarsipkan.
    const targetEmp = await prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
      select: { id: true },
    })
    if (!targetEmp) {
      return fail('Data trainee tidak ditemukan atau sudah diarsipkan', 'NOT_FOUND')
    }

    const { posisi, traineeSejak: traineeSejakRaw, contractNumber } = parsed.data
    const months = await getPositionMonths(posisi)
    if (months === null) {
      return fail(`Posisi "${posisi}" tidak terdaftar - tambahkan dulu di Kelola Posisi`, 'VALIDATION', { posisi: 'Posisi tidak terdaftar' })
    }
    const traineeSejak = new Date(traineeSejakRaw)
    const traineeSelesai = calculateEndDate(traineeSejak, months)

    const newContract = await prisma.contract.create({
      data: { posisi, traineeSejak, traineeSelesai, employeeId, contractNumber: contractNumber ?? null },
    })

    await createAuditLog(
      session.id,
      session.username,
      'CREATE',
      'contract',
      newContract.id,
      { employeeId, posisiBaru: posisi }
    )

    revalidatePath(`/karyawan/${employeeId}`)
    revalidatePath('/')
    return ok({ employeeId }, 'Kontrak berhasil diterbitkan')
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('createContract failed', { employeeId, error: String(error) })
    return fail('Kami belum bisa menerbitkan kontrak - coba kirim ulang dalam beberapa saat', 'SERVER_ERROR')
  }
}

// ─── Delete Employee ──────────────────────────────────────────────────────────
/**
 * Soft delete: tandai `deletedAt` alih-alih hapus permanen. Data + riwayat
 * kontrak tetap ada dan bisa dipulihkan dari halaman Arsip.
 */
export async function deleteEmployee(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('employee_delete')

    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: null },
      select: { namaLengkap: true },
    })

    if (!employee) {
      return fail('Data trainee tidak ditemukan - mungkin sudah dihapus', 'NOT_FOUND')
    }

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await createAuditLog(
      session.id,
      session.username,
      'DELETE',
      'employee',
      id,
      { namaTerhapus: employee.namaLengkap, jenis: 'arsip' }
    )

    revalidatePath('/')
    revalidatePath('/karyawan')
    return ok({ id })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('deleteEmployee failed', { error: String(error) })
    return fail('Kami belum bisa mengarsipkan data - coba ulangi dalam beberapa saat', 'SERVER_ERROR')
  }
}

/** Pulihkan trainee yang diarsipkan (deletedAt → null). */
export async function restoreEmployee(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('employee_delete')

    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { namaLengkap: true },
    })

    if (!employee) {
      return fail('Data arsip tidak ditemukan - mungkin sudah dipulihkan', 'NOT_FOUND')
    }

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: null },
    })

    await createAuditLog(
      session.id,
      session.username,
      'UPDATE',
      'employee',
      id,
      { namaDipulihkan: employee.namaLengkap, jenis: 'restore' }
    )

    revalidatePath('/')
    revalidatePath('/karyawan')
    revalidatePath('/karyawan/arsip')
    return ok({ id })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('restoreEmployee failed', { error: String(error) })
    return fail('Kami belum bisa memulihkan data - coba ulangi dalam beberapa saat', 'SERVER_ERROR')
  }
}

/**
 * Hapus permanen (hard delete) — hanya ADMIN, hanya untuk data yang SUDAH
 * diarsipkan. Kontrak ikut terhapus (cascade). Tidak bisa dipulihkan.
 */
export async function permanentlyDeleteEmployee(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('user_manage') // ADMIN-only

    const employee = await prisma.employee.findFirst({
      where: { id, deletedAt: { not: null } },
      select: { namaLengkap: true },
    })

    if (!employee) {
      return fail('Data harus diarsipkan dulu sebelum dihapus permanen', 'NOT_FOUND')
    }

    await prisma.employee.delete({ where: { id } })

    await createAuditLog(
      session.id,
      session.username,
      'DELETE',
      'employee',
      id,
      { namaTerhapus: employee.namaLengkap, jenis: 'permanen' }
    )

    revalidatePath('/karyawan/arsip')
    return ok({ id })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('permanentlyDeleteEmployee failed', { error: String(error) })
    return fail('Kami belum bisa menghapus data - coba ulangi dalam beberapa saat', 'SERVER_ERROR')
  }
}

/** Daftar trainee yang diarsipkan (untuk halaman Arsip). */
export async function getArchivedEmployees() {
  try {
    await requirePermission('employee_delete')
    return await prisma.employee.findMany({
      where: { deletedAt: { not: null } },
      include: { contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 } },
      orderBy: { deletedAt: 'desc' },
    })
  } catch {
    return []
  }
}

// ─── Bulk Actions ─────────────────────────────────────────────────────────────
const MAX_BULK = 500 // batasi ukuran operasi massal (guard abuse/DoS)

/** Validasi & bersihkan array id dari client. */
function sanitizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return []
  const clean = ids.filter((x): x is string => typeof x === 'string' && x.length > 0)
  return [...new Set(clean)].slice(0, MAX_BULK)
}

/** Arsipkan banyak trainee sekaligus (soft delete). */
export async function bulkArchiveEmployees(ids: string[]): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requirePermission('employee_delete')
    const targetIds = sanitizeIds(ids)
    if (targetIds.length === 0) return fail('Tidak ada trainee yang dipilih', 'VALIDATION')

    const result = await prisma.employee.updateMany({
      where: { id: { in: targetIds }, deletedAt: null },
      data: { deletedAt: new Date() },
    })

    await createAuditLog(
      session.id, session.username, 'DELETE', 'employee', targetIds.join(','),
      { jenis: 'arsip_massal', jumlah: result.count }
    )

    revalidatePath('/')
    revalidatePath('/karyawan')
    revalidatePath('/karyawan/arsip')
    return ok({ count: result.count }, `${result.count} trainee dipindahkan ke Arsip`)
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('bulkArchiveEmployees failed', { error: String(error) })
    return fail('Kami belum bisa mengarsipkan data - coba ulangi', 'SERVER_ERROR')
  }
}

/** Ubah status (AKTIF / NON-AKTIF) banyak trainee sekaligus. */
export async function bulkUpdateEmployeeStatus(
  ids: string[],
  status: 'AKTIF' | 'NON-AKTIF',
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requirePermission('employee_update')
    if (status !== 'AKTIF' && status !== 'NON-AKTIF') {
      return fail('Status tidak valid', 'VALIDATION')
    }
    const targetIds = sanitizeIds(ids)
    if (targetIds.length === 0) return fail('Tidak ada trainee yang dipilih', 'VALIDATION')

    const result = await prisma.employee.updateMany({
      where: { id: { in: targetIds }, deletedAt: null },
      data: { status },
    })

    await createAuditLog(
      session.id, session.username, 'UPDATE', 'employee', targetIds.join(','),
      { jenis: 'status_massal', statusBaru: status, jumlah: result.count }
    )

    revalidatePath('/')
    revalidatePath('/karyawan')
    const label = status === 'AKTIF' ? 'Aktif' : 'Non-Aktif'
    return ok({ count: result.count }, `${result.count} trainee diset ${label}`)
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('bulkUpdateEmployeeStatus failed', { error: String(error) })
    return fail('Kami belum bisa mengubah status - coba ulangi', 'SERVER_ERROR')
  }
}

// ─── Read: Semua trainee untuk export ───────────────────────────────────────
type EmployeeExportItem = {
  ba: string
  baCabang: string
  cabang: string
  namaLengkap: string
  status: string
  nik: string | null
  noJamsostek: string | null
  noKtp: string
  tglLahir: Date | null
  namaIbu: string
  noHp: string | null
  formConsent: string | null
  gender: string | null
  contracts: { posisi: string; traineeSejak: Date; traineeSelesai: Date; contractNumber: string | null }[]
}

export async function getAllEmployeesForExport(): Promise<EmployeeExportItem[]> {
  await requireAuth()

  try {
    const employees = await prisma.employee.findMany({
      where: { deletedAt: null },
      include: {
        contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
      },
      orderBy: { namaLengkap: 'asc' },
    })

    return employees as unknown as EmployeeExportItem[]
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    logger.error('getAllEmployeesForExport failed', { error: String(error) })
    return []
  }
}

// ─── Read: Filter trainee (server-side pagination + contractFilter) ──────────
const PER_PAGE = 10

// Kolom yang benar-benar dirender tabel/kartu daftar. Data sensitif (No KTP,
// nama ibu, tgl lahir, no Jamsostek, path dokumen) TIDAK ikut — payload daftar
// terkirim ke browser semua peran, termasuk VIEWER. Detail lengkap hanya di
// halaman /karyawan/[id] yang punya guard sendiri.
const LIST_SELECT = {
  id: true,
  namaLengkap: true,
  nik: true,
  cabang: true,
  baCabang: true,
  status: true,
  gender: true,
  image: true,
  noHp: true,
  contracts: {
    orderBy: { traineeSelesai: 'desc' },
    take: 1,
    select: { posisi: true, traineeSejak: true, traineeSelesai: true, contractNumber: true },
  },
} satisfies Prisma.EmployeeSelect

export type EmployeeListRow = Prisma.EmployeeGetPayload<{ select: typeof LIST_SELECT }>

// Cocokkan bucket kontrak berdasarkan kontrak TERBARU (contracts[0]) trainee.
// Pakai logika yang sama persis dengan getEmployeeStats/getDashboardKPI agar
// hasil filter list == angka di kartu (dulu pakai `some` = kontrak apa pun,
// termasuk trainee NON-AKTIF & kontrak lama, sehingga tak cocok dengan kartu).
function matchesContractBucket(latest: Date | null | undefined, filter: string, today: Date): boolean {
  if (!latest) return false
  const days = differenceInDays(new Date(latest), today)
  switch (filter) {
    case 'expired':    return days < 0
    case 'expiring14': return days >= 0 && days <= 14
    case 'expiring30': return days >= 0 && days <= 30
    case 'expiring90': return days >= 0 && days <= 90
    case 'safe':       return days > 90
    default:           return true
  }
}

type SortableEmployee = {
  namaLengkap: string
  nik: string | null
  cabang: string
  contracts: { posisi: string; traineeSelesai: Date }[]
}

// Sort lintas seluruh dataset (bukan hanya halaman aktif). Kolom posisi/traineeSelesai
// diturunkan dari kontrak terbaru, jadi sort dilakukan di server setelah fetch-all.
function sortEmployeeRows<T extends SortableEmployee>(rows: T[], sortBy: string, sortDir: 'asc' | 'desc'): T[] {
  const dir = sortDir === 'desc' ? -1 : 1
  const getVal = (r: T): string => {
    switch (sortBy) {
      case 'nik':            return r.nik ?? ''
      case 'cabang':         return r.cabang
      case 'posisi':         return r.contracts[0]?.posisi ?? ''
      case 'traineeSelesai': return r.contracts[0]?.traineeSelesai ? new Date(r.contracts[0].traineeSelesai).toISOString() : ''
      default:               return r.namaLengkap
    }
  }
  return [...rows].sort((a, b) => {
    const va = getVal(a).toLowerCase()
    const vb = getVal(b).toLowerCase()
    if (va < vb) return -1 * dir
    if (va > vb) return 1 * dir
    return 0
  })
}

export async function getEmployees({
  search = '',
  cabang = '',
  status = '',
  contractFilter = '',
  posisi = '',
  page = 1,
  perPage = PER_PAGE,
  sortBy = '',
  sortDir = 'asc',
}: {
  search?: string
  cabang?: string
  status?: string
  contractFilter?: string
  posisi?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
} = {}) {
  try {
    await requireAuth()

    // Clamp paginasi dari client agar tidak bisa dipakai dump-table / DoS.
    const safePage = Math.max(1, Math.floor(page) || 1)
    const safePerPage = Math.min(100, Math.max(1, Math.floor(perPage) || PER_PAGE))

    const today = startOfDay(new Date())
    const where = {
      deletedAt: null,
      AND: [
        { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }, { contracts: { some: { posisi: { contains: search } } } }] },
        cabang ? { cabang } : {},
        status ? { status } : {},
        posisi ? { contracts: { some: { posisi } } } : {},
      ],
    }

    // Filter bucket kontrak & sort kolom turunan (posisi/traineeSelesai) butuh
    // kontrak TERBARU tiap trainee — tidak bisa diungkapkan sebagai satu query
    // SQL lewat Prisma. Hanya jalur itu yang fetch-all + proses di memori;
    // jalur biasa (mayoritas pemakaian) paginasi di DB.
    const needsLatestContract =
      contractFilter !== '' || sortBy === 'posisi' || sortBy === 'traineeSelesai'

    if (!needsLatestContract) {
      const orderBy =
        sortBy === 'nik' ? { nik: sortDir }
        : sortBy === 'cabang' ? { cabang: sortDir }
        : { namaLengkap: sortDir }

      const [employees, total] = await prisma.$transaction([
        prisma.employee.findMany({
          where,
          select: LIST_SELECT,
          orderBy,
          skip: (safePage - 1) * safePerPage,
          take: safePerPage,
        }),
        prisma.employee.count({ where }),
      ])
      return { employees, total, loadError: false }
    }

    // ponytail: jalur kontrak masih fetch-all lalu potong di memori. Aman
    // sampai ~5rb trainee; kalau tembus, pindahkan "kontrak terbaru" ke kolom
    // turunan di tabel employee (di-update saat kontrak dibuat) supaya bisa
    // di-ORDER BY / WHERE langsung di SQL.
    const all = await prisma.employee.findMany({ where, select: LIST_SELECT })

    // Filter bucket kontrak di memori pakai kontrak terbaru. Tanpa filter status
    // eksplisit (mis. klik kartu), batasi ke AKTIF agar hasil sama persis dengan
    // angka kartu. Kalau user memilih status di funnel, `all` sudah terbatas
    // status itu → hormati pilihannya.
    const filtered = contractFilter
      ? all.filter(e => (status !== '' || e.status === 'AKTIF') && matchesContractBucket(e.contracts[0]?.traineeSelesai, contractFilter, today))
      : all

    const sorted = sortEmployeeRows(filtered, sortBy, sortDir)
    const total = sorted.length
    const employees = sorted.slice((safePage - 1) * safePerPage, safePage * safePerPage)

    return { employees, total, loadError: false }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    logger.error('getEmployees failed', { error: String(error) })
    // loadError membedakan "gagal ambil data" dari "data memang kosong",
    // supaya UI bisa menampilkan error state + retry (bukan empty state).
    return { employees: [], total: 0, loadError: true }
  }
}

// ─── Read: Distinct cabang untuk filter dropdown ──────────────────────────────
// value = kode (dipakai query filter), label = nama daerah (ditampilkan ke user).
export async function getDistinctCabang(): Promise<{ code: string; label: string }[]> {
  try {
    await requireAuth()
    const result = await prisma.employee.findMany({
      where: { deletedAt: null },
      select: { cabang: true, baCabang: true },
      distinct: ['cabang'],
      orderBy: { baCabang: 'asc' },
    })
    return result.map(r => ({ code: r.cabang, label: r.baCabang || r.cabang }))
  } catch {
    return []
  }
}

// ─── Read: Aggregate stats untuk dashboard trainee ──────────────────────────
export async function getEmployeeStats({
  search = '',
  cabang = '',
  posisi = '',
}: {
  search?: string
  cabang?: string
  posisi?: string
} = {}) {
  try {
    await requireAuth()
    const today = startOfDay(new Date())

    // Scope statistik mengikuti filter populasi (search/cabang/posisi) agar
    // angka kartu konsisten dengan tabel. Filter status & kontrak TIDAK diterapkan
    // di sini karena justru itu yang dipecah oleh kartu-kartu ini.
    const baseWhere = {
      deletedAt: null,
      AND: [
        { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }, { contracts: { some: { posisi: { contains: search } } } }] },
        cabang ? { cabang } : {},
        posisi ? { contracts: { some: { posisi } } } : {},
      ],
    }

    // Get total and status-based counts
    const [total, statusAktif] = await prisma.$transaction([
      prisma.employee.count({ where: baseWhere }),
      prisma.employee.count({ where: { ...baseWhere, status: 'AKTIF' } }),
    ])

    // Get latest contracts for AKTIF employees matching filters
    const latestContracts = await prisma.contract.findMany({
      where: { employee: { ...baseWhere, status: 'AKTIF' } },
      orderBy: { traineeSelesai: 'desc' },
      distinct: ['employeeId'],
      select: { traineeSelesai: true },
    })

    // Derive real counts from contract data
    let contractValid = 0
    let contractExpired = 0
    let segera = 0 // ≤ 30 hari

    latestContracts.forEach(c => {
      const days = differenceInDays(new Date(c.traineeSelesai), today)
      if (days < 0) {
        contractExpired++
      } else {
        contractValid++
        if (days <= 30) segera++
      }
    })

    return {
      total,
      aktif: contractValid,
      nonAktif: total - statusAktif,
      segera,
      expired: contractExpired,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    logger.error('getEmployeeStats failed', { error: String(error) })
    return { total: 0, aktif: 0, nonAktif: 0, segera: 0, expired: 0 }
  }
}

// ─── Read: Dashboard KPI — derived from actual contract data ─────────────────
export async function getDashboardKPI() {
  try {
    await requireAuth()
    const today = startOfDay(new Date())

    const [totalAll, totalAktif, totalNonAktif, latestContracts] = await Promise.all([
      prisma.employee.count({ where: { deletedAt: null } }),
      prisma.employee.count({ where: { status: 'AKTIF', deletedAt: null } }),
      prisma.employee.count({ where: { status: 'NON-AKTIF', deletedAt: null } }),
      prisma.contract.findMany({
        where: { employee: { status: 'AKTIF', deletedAt: null } },
        orderBy: { traineeSelesai: 'desc' },
        distinct: ['employeeId'],
        select: { traineeSelesai: true, employeeId: true },
      }),
    ])

    let contractValid = 0
    let contractExpired = 0
    let expiring14 = 0
    let expiring30 = 0
    let expiring90 = 0
    let safe = 0

    latestContracts.forEach(c => {
      const days = differenceInDays(new Date(c.traineeSelesai), today)
      if (days < 0) {
        contractExpired++
      } else {
        contractValid++
        if (days <= 14) expiring14++
        if (days <= 30) expiring30++
        if (days <= 90) expiring90++
        if (days > 90) safe++
      }
    })

    // Trainee AKTIF tanpa kontrak sama sekali
    const noContract = totalAktif - latestContracts.length

    // Persentase kontrak valid dari total trainee aktif
    const validPercent = totalAktif > 0 ? Math.round((contractValid / totalAktif) * 100) : 0

    return {
      totalAll,
      totalAktif,
      totalNonAktif,
      contractValid,
      contractExpired,
      noContract,
      expiring14,
      expiring30,
      expiring90,
      safe,
      // Warning gap (31-90 hari)
      warningRange: expiring90 - expiring30,
      validPercent,
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error
    logger.error('getDashboardKPI failed', { error: String(error) })
    return {
      totalAll: 0, totalAktif: 0, totalNonAktif: 0,
      contractValid: 0, contractExpired: 0, noContract: 0,
      expiring14: 0, expiring30: 0, expiring90: 0, safe: 0,
      warningRange: 0, validPercent: 0,
    }
  }
}

