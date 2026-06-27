'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-guard'
import { createAuditLog } from '@/lib/audit'
import { ok, fail, type ActionResult } from '@/lib/result'
import { isUniqueViolation } from '@/lib/prisma-error'
import { logger } from '@/lib/logger'
import { departmentSchema } from '@/lib/validation'



export async function getDepartments() {
  try {
    return await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    })
  } catch {
    return []
  }
}

export async function createDepartment(data: Record<string, string | null>): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()
    const raw = {
      name: (data.name ?? '').trim(),
      code: (data.code ?? '').trim().toUpperCase(),
    }

    const parsed = departmentSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali', 'VALIDATION')
    }

    const existing = await prisma.department.findFirst({
      where: { OR: [{ name: parsed.data.name }, { code: parsed.data.code }] },
    })
    if (existing) return fail('Nama atau kode ini sudah dipakai departemen lain - gunakan nama/kode berbeda', 'DUPLICATE')

    const dept = await prisma.department.create({ data: parsed.data })

    await createAuditLog(session.id, session.username, 'CREATE', 'department', dept.id, { name: dept.name, code: dept.code })
    revalidatePath('/admin/departments')
    return ok({ id: dept.id }, `Departemen ${dept.name} berhasil dibuat`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin - hubungi Admin', 'UNAUTHORIZED')
    if (isUniqueViolation(error)) return fail('Nama atau kode ini sudah dipakai departemen lain - gunakan nama/kode berbeda', 'DUPLICATE')
    logger.error('createDepartment failed', { error: String(error) })
    return fail('Kami belum bisa membuat departemen - coba kirim ulang', 'SERVER_ERROR')
  }
}

export async function updateDepartment(id: string, data: Record<string, string | null>): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()
    const raw = {
      name: (data.name ?? '').trim(),
      code: (data.code ?? '').trim().toUpperCase(),
    }

    const parsed = departmentSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali', 'VALIDATION')
    }

    const existing = await prisma.department.findFirst({
      where: { OR: [{ name: parsed.data.name }, { code: parsed.data.code }], NOT: { id } },
    })
    if (existing) return fail('Nama atau kode ini sudah dipakai departemen lain - gunakan nama/kode berbeda', 'DUPLICATE')

    await prisma.department.update({ where: { id }, data: parsed.data })
    await createAuditLog(session.id, session.username, 'UPDATE', 'department', id, { name: parsed.data.name, code: parsed.data.code })
    revalidatePath('/admin/departments')
    return ok({ id }, `Departemen diperbarui`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin - hubungi Admin', 'UNAUTHORIZED')
    if (isUniqueViolation(error)) return fail('Nama atau kode ini sudah dipakai departemen lain - gunakan nama/kode berbeda', 'DUPLICATE')
    logger.error('updateDepartment failed', { error: String(error) })
    return fail('Kami belum bisa menyimpan perubahan - coba simpan ulang', 'SERVER_ERROR')
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()

    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    })
    if (!dept) return fail('Departemen tidak ditemukan - mungkin sudah dihapus', 'NOT_FOUND')
    if (dept._count.employees > 0) {
      return fail(`Departemen ini masih memiliki ${dept._count.employees} karyawan - pindahkan mereka terlebih dahulu`, 'VALIDATION')
    }

    await prisma.department.delete({ where: { id } })
    await createAuditLog(session.id, session.username, 'DELETE', 'department', id, { name: dept.name })
    revalidatePath('/admin/departments')
    return ok({ id }, `Departemen ${dept.name} dihapus`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin - hubungi Admin', 'UNAUTHORIZED')
    logger.error('deleteDepartment failed', { error: String(error) })
    return fail('Kami belum bisa menghapus departemen - coba ulangi', 'SERVER_ERROR')
  }
}
