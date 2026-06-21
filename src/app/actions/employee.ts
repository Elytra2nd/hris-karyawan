'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addMonths, differenceInDays, startOfDay } from 'date-fns'
import { createAuditLog } from '@/lib/audit'
import { requirePermission, requireAuth } from '@/lib/auth-guard'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createContractSchema,
  formDataToObject,
} from '@/lib/validation'
import { ok, fail, ActionResult } from '@/lib/result'
import { logger } from '@/lib/logger'
import type { Prisma } from '@prisma/client'

// ─── Business Rule: hitung tanggal selesai ────────────────────────────────────
function calculateEndDate(posisi: string, startDate: Date): Date {
  return posisi.toLowerCase().includes('admin')
    ? addMonths(startDate, 3)
    : addMonths(startDate, 6)
}

// Prisma P2002 = unique constraint violation. Cek apakah menyangkut field noKtp.
function isUniqueKtpError(error: unknown): boolean {
  const e = error as { code?: string; meta?: { target?: unknown } }
  if (e?.code !== 'P2002') return false
  const target = e.meta?.target
  return Array.isArray(target) ? target.includes('noKtp') : String(target ?? '').includes('noKtp')
}

// ─── Create Employee ──────────────────────────────────────────────────────────
export async function createEmployee(formData: FormData) {
  const session = await requirePermission('employee_create')
  const raw = formDataToObject(formData)

  const parsed = createEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali formulir'
    return fail(firstError, 'VALIDATION')
  }

  const {
    ba, baCabang, cabang, namaLengkap,
    nik, noKtp, tglLahir, namaIbu, noHp,
    noJamsostek, formConsent, posisi, traineeSejak: traineeSejakRaw,
    departmentId: deptId,
  } = parsed.data

  const traineeSejak = new Date(traineeSejakRaw)
  const traineeSelesai = calculateEndDate(posisi, traineeSejak)
  const departmentId = deptId ?? null

  let newEmployee
  try {
    newEmployee = await prisma.employee.create({
      data: {
        ba, baCabang, cabang, namaLengkap,
        status: 'AKTIF',
        nik: nik ?? null,
        noJamsostek: noJamsostek ?? null,
        noKtp, tglLahir, namaIbu, noHp, formConsent,
        departmentId,
        contracts: { create: { posisi, traineeSejak, traineeSelesai } },
      } satisfies Prisma.EmployeeUncheckedCreateInput,
    })
  } catch (error) {
    if (isUniqueKtpError(error)) {
      return fail(`No KTP ${noKtp} sudah terdaftar di sistem - gunakan nomor KTP lain`, 'DUPLICATE')
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
export async function updateEmployee(id: string, formData: FormData) {
  const session = await requirePermission('employee_update')
  const raw = formDataToObject(formData)

  const parsed = updateEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali formulir', 'VALIDATION')
  }

  const {
    ba, baCabang, cabang, namaLengkap,
    nik, noKtp, tglLahir, namaIbu, noHp,
    noJamsostek, formConsent, status,
    departmentId: deptId,
  } = parsed.data

  const departmentId = deptId ?? null

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        ba, baCabang, cabang, namaLengkap, status,
        nik: nik ?? null,
        noJamsostek: noJamsostek ?? null,
        noKtp, tglLahir, namaIbu, noHp, formConsent,
        departmentId,
      } satisfies Prisma.EmployeeUncheckedUpdateInput,
    })
  } catch (error) {
    if (isUniqueKtpError(error)) {
      return fail(`No KTP ${noKtp} sudah digunakan karyawan lain - gunakan nomor KTP berbeda`, 'DUPLICATE')
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
export async function createContract(employeeId: string, formData: FormData): Promise<ActionResult<{ employeeId: string }>> {
  try {
    const session = await requirePermission('contract_create')
    const raw = formDataToObject(formData)

    const parsed = createContractSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian kontrak yang belum lengkap - periksa kembali', 'VALIDATION')
    }

    const { posisi, traineeSejak: traineeSejakRaw } = parsed.data
    const traineeSejak = new Date(traineeSejakRaw)
    const traineeSelesai = calculateEndDate(posisi, traineeSejak)

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
  department: { name: string; code: string } | null
}

export async function getAllEmployeesForExport(): Promise<EmployeeExportItem[]> {
  await requireAuth()

  try {
    // Fetch employees and departments separately to avoid Prisma cache issues with include
    const [employees, departments] = await Promise.all([
      prisma.employee.findMany({
        include: {
          contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
        },
        orderBy: { namaLengkap: 'asc' },
      }),
      prisma.department.findMany({ select: { id: true, name: true, code: true } }),
    ])

    const deptMap = new Map(departments.map(d => [d.id, { name: d.name, code: d.code }]))

    return employees.map(emp => ({
      ...emp,
      department: emp.departmentId ? deptMap.get(emp.departmentId) ?? null : null,
    })) as unknown as EmployeeExportItem[]
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

export async function getEmployees({
  search = '',
  cabang = '',
  status = '',
  contractFilter = '',
  posisi = '',
  departmentId = '',
  page = 1,
  perPage = PER_PAGE,
}: {
  search?: string
  cabang?: string
  status?: string
  contractFilter?: string
  posisi?: string
  departmentId?: string
  page?: number
  perPage?: number
} = {}) {
  try {
    const today = new Date()
    const where = {
      AND: [
        { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }] },
        cabang ? { cabang } : {},
        status ? { status } : {},
        posisi ? { contracts: { some: { posisi } } } : {},
        departmentId ? { departmentId } : {},
        buildContractWhere(contractFilter, today),
      ],
    }

    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        include: { contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 }, department: true },
        orderBy: { namaLengkap: 'asc' },
        take: perPage,
        skip: (page - 1) * perPage,
      }),
      prisma.employee.count({ where }),
    ])

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
}: {
  search?: string
  cabang?: string
} = {}) {
  try {
    const today = startOfDay(new Date())

    const baseWhere = {
      AND: [
        { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }] },
        cabang ? { cabang } : {},
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

// ─── Read: Statistik per departemen untuk dashboard ──────────────────────────
export async function getDepartmentStats() {
  try {
    const result = await prisma.employee.groupBy({
      by: ['departmentId'],
      where: { status: 'AKTIF' },
      _count: { departmentId: true },
      orderBy: { _count: { departmentId: 'desc' } },
    })

    // Fetch department names
    const deptIds = result
      .map(r => r.departmentId)
      .filter((id): id is string => id !== null)

    const departments = deptIds.length > 0
      ? await prisma.department.findMany({
          where: { id: { in: deptIds } },
          select: { id: true, name: true, code: true },
        })
      : []

    const deptMap = new Map(departments.map(d => [d.id, d]))

    return result.map(r => ({
      departmentId: r.departmentId,
      name: r.departmentId ? deptMap.get(r.departmentId)?.name ?? 'Unknown' : 'Belum Ditugaskan',
      code: r.departmentId ? deptMap.get(r.departmentId)?.code ?? '-' : '-',
      count: r._count.departmentId,
    }))
  } catch (error) {
    logger.error('getDepartmentStats failed', { error: String(error) })
    return []
  }
}
