'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addMonths } from 'date-fns'
import { createAuditLog } from '@/lib/audit'
import { requirePermission } from '@/lib/auth-guard'
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  createContractSchema,
  formDataToObject,
} from '@/lib/validation'
import { ok, fail, ActionResult } from '@/lib/result'
import { logger } from '@/lib/logger'

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
    const firstError = parsed.error.issues[0]?.message ?? 'Data tidak valid'
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
      },
    })
  } catch (error) {
    if (isUniqueKtpError(error)) {
      return fail(`No KTP ${noKtp} sudah terdaftar`, 'DUPLICATE')
    }
    logger.error('createEmployee failed', { error: String(error) })
    return fail('Gagal menyimpan data karyawan', 'SERVER_ERROR')
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
    return fail(parsed.error.issues[0]?.message ?? 'Data tidak valid', 'VALIDATION')
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
      },
    })
  } catch (error) {
    if (isUniqueKtpError(error)) {
      return fail(`No KTP ${noKtp} sudah dipakai karyawan lain`, 'DUPLICATE')
    }
    logger.error('updateEmployee failed', { id, error: String(error) })
    return fail('Gagal memperbarui data karyawan', 'SERVER_ERROR')
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
      return fail(parsed.error.issues[0]?.message ?? 'Data kontrak tidak valid', 'VALIDATION')
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
    if (e?.code === 'UNAUTHORIZED') return fail(e.message ?? 'Akses ditolak', 'UNAUTHORIZED')
    logger.error('createContract failed', { employeeId, error: String(error) })
    return fail('Gagal menerbitkan kontrak', 'SERVER_ERROR')
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
      return fail('Data karyawan tidak ditemukan', 'NOT_FOUND')
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
    if (e?.code === 'UNAUTHORIZED') return fail(e.message ?? 'Akses ditolak', 'UNAUTHORIZED')
    logger.error('deleteEmployee failed', { error: String(error) })
    return fail('Gagal menghapus data karyawan', 'SERVER_ERROR')
  }
}

// ─── Read: Semua karyawan untuk export ───────────────────────────────────────
export async function getAllEmployeesForExport() {
  await requirePermission('employee_read')

  try {
    return await prisma.employee.findMany({
      include: {
        contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
        department: { select: { name: true, code: true } },
      },
      orderBy: { namaLengkap: 'asc' },
    })
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
  page = 1,
  perPage = PER_PAGE,
}: {
  search?: string
  cabang?: string
  status?: string
  contractFilter?: string
  posisi?: string
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
        buildContractWhere(contractFilter, today),
      ],
    }

    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        include: { contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 } },
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

// ─── Read: Aggregate stats untuk dashboard karyawan ──────────────────────────
export async function getEmployeeStats({
  search = '',
  cabang = '',
}: {
  search?: string
  cabang?: string
} = {}) {
  try {
    const today = new Date()
    const in30 = addDays(today, 30)

    const baseWhere = {
      AND: [
        { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }] },
        cabang ? { cabang } : {},
      ],
    }

    const [total, aktif, segera] = await prisma.$transaction([
      prisma.employee.count({ where: baseWhere }),
      prisma.employee.count({ where: { ...baseWhere, status: 'AKTIF' } }),
      prisma.employee.count({
        where: {
          ...baseWhere,
          contracts: { some: { traineeSelesai: { gte: today, lte: in30 } } },
        },
      }),
    ])

    return { total, aktif, nonAktif: total - aktif, segera }
  } catch (error) {
    logger.error('getEmployeeStats failed', { error: String(error) })
    return { total: 0, aktif: 0, nonAktif: 0, segera: 0 }
  }
}
