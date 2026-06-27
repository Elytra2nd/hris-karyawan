'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addMonths, subDays, differenceInDays, startOfDay } from 'date-fns'
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

// ─── Business Rule: hitung tanggal selesai ────────────────────────────────────
// Hari terakhir periode (inklusif): +N bulan lalu mundur 1 hari.
// mis. mulai 01 Jul, 6 bln -> 31 Des (bukan 01 Jan).
function calculateEndDate(startDate: Date, months: number): Date {
  return subDays(addMonths(startDate, months), 1)
}

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
    noJamsostek, formConsent, posisi, traineeSejak: traineeSejakRaw,
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
        contracts: { create: { posisi, traineeSejak, traineeSelesai } },
      } satisfies Prisma.EmployeeUncheckedCreateInput,
    })
  } catch (error) {
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
    noJamsostek, formConsent, status,
  } = parsed.data

  // BA & BA Cabang diturunkan dari Cabang (Branch). Sekaligus validasi cabang.
  const branch = await prisma.branch.findUnique({ where: { code: cabang.toUpperCase() } })
  if (!branch) {
    return fail(`Cabang "${cabang}" tidak terdaftar - pilih dari daftar atau tambahkan di Kelola Cabang`, 'VALIDATION', { cabang: 'Cabang tidak terdaftar' })
  }

  // @db.Date di Prisma butuh objek Date, bukan string "yyyy-MM-dd"
  const tglLahir = new Date(tglLahirRaw)

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        ba: branch.code, baCabang: branch.label, cabang: branch.code, namaLengkap, status,
        nik: nik ?? null,
        noJamsostek: noJamsostek ?? null,
        noKtp, tglLahir, namaIbu, noHp, formConsent,
      } satisfies Prisma.EmployeeUncheckedUpdateInput,
    })
  } catch (error) {
    if (isUniqueViolation(error, 'noKtp')) {
      return fail(`No KTP ${noKtp} sudah digunakan karyawan lain - gunakan nomor KTP berbeda`, 'DUPLICATE', { noKtp: 'No KTP ini sudah dipakai karyawan lain' })
    }
    logger.error('updateEmployee failed', { id, error: String(error) })
    return fail('Kami belum bisa menyimpan perubahan - coba simpan ulang dalam beberapa saat', 'SERVER_ERROR')
  }

  await createAuditLog(
    session.id,
    session.username,
    'UPDATE',
    'employee',
    id,
    { updatedFields: Object.keys(parsed.data), statusTarget: status }
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

    const { posisi, traineeSejak: traineeSejakRaw } = parsed.data
    const months = await getPositionMonths(posisi)
    if (months === null) {
      return fail(`Posisi "${posisi}" tidak terdaftar - tambahkan dulu di Kelola Posisi`, 'VALIDATION', { posisi: 'Posisi tidak terdaftar' })
    }
    const traineeSejak = new Date(traineeSejakRaw)
    const traineeSelesai = calculateEndDate(traineeSejak, months)

    const newContract = await prisma.contract.create({
      data: { posisi, traineeSejak, traineeSelesai, employeeId },
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
export async function deleteEmployee(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('employee_delete')

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { namaLengkap: true },
    })

    if (!employee) {
      return fail('Data karyawan tidak ditemukan - mungkin sudah dihapus', 'NOT_FOUND')
    }

    await prisma.employee.delete({ where: { id } })

    await createAuditLog(
      session.id,
      session.username,
      'DELETE',
      'employee',
      id,
      { namaTerhapus: employee.namaLengkap }
    )

    revalidatePath('/')
    revalidatePath('/karyawan')
    return ok({ id })
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin untuk tindakan ini - hubungi Admin', 'UNAUTHORIZED')
    logger.error('deleteEmployee failed', { error: String(error) })
    return fail('Kami belum bisa menghapus data - coba ulangi dalam beberapa saat', 'SERVER_ERROR')
  }
}

// ─── Read: Semua karyawan untuk export ───────────────────────────────────────
type EmployeeExportItem = {
  ba: string
  baCabang: string
  cabang: string
  namaLengkap: string
  status: string
  nik: string | null
  noJamsostek: string | null
  noKtp: string
  tglLahir: Date
  namaIbu: string
  noHp: string
  formConsent: string
  contracts: { posisi: string; traineeSejak: Date; traineeSelesai: Date }[]
}

export async function getAllEmployeesForExport(): Promise<EmployeeExportItem[]> {
  await requireAuth()

  try {
    const employees = await prisma.employee.findMany({
      include: {
        contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
      },
      orderBy: { namaLengkap: 'asc' },
    })

    return employees as unknown as EmployeeExportItem[]
  } catch (error) {
    logger.error('getAllEmployeesForExport failed', { error: String(error) })
    return []
  }
}

// ─── Read: Filter karyawan (server-side pagination + contractFilter) ──────────
const PER_PAGE = 10

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 86400000)
}

function buildContractWhere(contractFilter: string, today: Date) {
  switch (contractFilter) {
    case 'expired':    return { contracts: { some: { traineeSelesai: { lt: today } } } }
    case 'expiring14': return { contracts: { some: { traineeSelesai: { gte: today, lte: addDays(today, 14) } } } }
    case 'expiring30': return { contracts: { some: { traineeSelesai: { gte: today, lte: addDays(today, 30) } } } }
    case 'expiring90': return { contracts: { some: { traineeSelesai: { gte: today, lte: addDays(today, 90) } } } }
    default:           return {}
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
    const today = new Date()
    const where = {
      AND: [
        { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }, { contracts: { some: { posisi: { contains: search } } } }] },
        cabang ? { cabang } : {},
        status ? { status } : {},
        posisi ? { contracts: { some: { posisi } } } : {},
        buildContractWhere(contractFilter, today),
      ],
    }

    // Fetch seluruh hasil filter agar sort berlaku global (bukan per halaman),
    // lalu paginate di memori. Skala data HRIS ini kecil sehingga aman.
    const all = await prisma.employee.findMany({
      where,
      include: { contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 } },
    })

    const sorted = sortEmployeeRows(all, sortBy, sortDir)
    const total = sorted.length
    const employees = sorted.slice((page - 1) * perPage, page * perPage)

    return { employees, total }
  } catch (error) {
    logger.error('getEmployees failed', { error: String(error) })
    return { employees: [], total: 0 }
  }
}

// ─── Read: Distinct cabang untuk filter dropdown ──────────────────────────────
export async function getDistinctCabang(): Promise<string[]> {
  try {
    const result = await prisma.employee.findMany({
      select: { cabang: true },
      distinct: ['cabang'],
      orderBy: { cabang: 'asc' },
    })
    return result.map(r => r.cabang)
  } catch {
    return []
  }
}

// ─── Read: Aggregate stats untuk dashboard karyawan ──────────────────────────
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
    const today = startOfDay(new Date())

    // Scope statistik mengikuti filter populasi (search/cabang/posisi) agar
    // angka kartu konsisten dengan tabel. Filter status & kontrak TIDAK diterapkan
    // di sini karena justru itu yang dipecah oleh kartu-kartu ini.
    const baseWhere = {
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
    logger.error('getEmployeeStats failed', { error: String(error) })
    return { total: 0, aktif: 0, nonAktif: 0, segera: 0, expired: 0 }
  }
}

// ─── Read: Dashboard KPI — derived from actual contract data ─────────────────
export async function getDashboardKPI() {
  try {
    const today = startOfDay(new Date())

    const [totalAll, totalAktif, totalNonAktif, latestContracts] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'AKTIF' } }),
      prisma.employee.count({ where: { status: 'NON-AKTIF' } }),
      prisma.contract.findMany({
        where: { employee: { status: 'AKTIF' } },
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

    // Karyawan AKTIF tanpa kontrak sama sekali
    const noContract = totalAktif - latestContracts.length

    // Persentase kontrak valid dari total karyawan aktif
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
    logger.error('getDashboardKPI failed', { error: String(error) })
    return {
      totalAll: 0, totalAktif: 0, totalNonAktif: 0,
      contractValid: 0, contractExpired: 0, noContract: 0,
      expiring14: 0, expiring30: 0, expiring90: 0, safe: 0,
      warningRange: 0, validPercent: 0,
    }
  }
}

