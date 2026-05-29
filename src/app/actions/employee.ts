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
    // Server action yang redirect tidak bisa return error — lempar exception
    throw new Error(firstError)
  }

  const {
    ba, baCabang, cabang, namaLengkap,
    nik, noKtp, tglLahir, namaIbu, noHp,
    noJamsostek, formConsent, posisi, traineeSejak: traineeSejakRaw,
  } = parsed.data

  const traineeSejak = new Date(traineeSejakRaw)
  const traineeSelesai = calculateEndDate(posisi, traineeSejak)
  const departmentId = raw['departmentId'] || null

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
      throw new Error(`No KTP ${noKtp} sudah terdaftar`)
    }
    logger.error('createEmployee failed', { error: String(error) })
    throw new Error('Gagal menyimpan data karyawan')
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
  redirect('/karyawan')
}

// ─── Update Employee ──────────────────────────────────────────────────────────
export async function updateEmployee(id: string, formData: FormData) {
  const session = await requirePermission('employee_update')
  const raw = formDataToObject(formData)

  const parsed = updateEmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Data tidak valid')
  }

  const {
    ba, baCabang, cabang, namaLengkap,
    nik, noKtp, tglLahir, namaIbu, noHp,
    noJamsostek, formConsent, status,
  } = parsed.data

  const departmentId = raw['departmentId'] || null

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
      throw new Error(`No KTP ${noKtp} sudah dipakai karyawan lain`)
    }
    logger.error('updateEmployee failed', { id, error: String(error) })
    throw new Error('Gagal memperbarui data karyawan')
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
  redirect(`/karyawan/${id}`)
}

// ─── Create Contract ──────────────────────────────────────────────────────────
export async function createContract(employeeId: string, formData: FormData) {
  const session = await requirePermission('contract_create')
  const raw = formDataToObject(formData)

  const parsed = createContractSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Data kontrak tidak valid')
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
  redirect(`/karyawan/${employeeId}`)
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
  } catch (error: any) {
    if (error.code === 'UNAUTHORIZED') return fail(error.message, 'UNAUTHORIZED')
    logger.error('deleteEmployee failed', { error: String(error) })
    return fail('Gagal menghapus data karyawan', 'SERVER_ERROR')
  }
}

// ─── Read: Semua karyawan untuk export ───────────────────────────────────────
export async function getAllEmployeesForExport() {
  try {
    return await prisma.employee.findMany({
      include: {
        contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
      },
      orderBy: { namaLengkap: 'asc' },
    })
  } catch (error) {
    logger.error('getAllEmployeesForExport failed', { error: String(error) })
    return []
  }
}

// ─── Read: Filter karyawan ────────────────────────────────────────────────────
export async function getEmployees({
  search = '',
  cabang = '',
  status = '',
}: {
  search?: string
  cabang?: string
  status?: string
} = {}) {
  try {
    return await prisma.employee.findMany({
      where: {
        AND: [
          {
            OR: [
              { namaLengkap: { contains: search } },
              { nik: { contains: search } },
            ],
          },
          cabang ? { cabang } : {},
          status ? { status } : {},
        ],
      },
      include: {
        contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
      },
      orderBy: { namaLengkap: 'asc' },
    })
  } catch (error) {
    logger.error('getEmployees failed', { error: String(error) })
    return []
  }
}
