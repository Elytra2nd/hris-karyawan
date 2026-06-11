'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-guard'
import { createAuditLog } from '@/lib/audit'
import { ok, fail, type ActionResult } from '@/lib/result'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const departmentSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  code: z.string().min(1, 'Kode wajib diisi').max(20).regex(/^[A-Z0-9_-]+$/, 'Kode hanya huruf kapital, angka, dan strip'),
})

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

export async function createDepartment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()
    const raw = { name: formData.get('name')?.toString().trim() ?? '', code: formData.get('code')?.toString().trim().toUpperCase() ?? '' }

    const parsed = departmentSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Data tidak valid', 'VALIDATION')
    }

    const existing = await prisma.department.findFirst({
      where: { OR: [{ name: parsed.data.name }, { code: parsed.data.code }] },
    })
    if (existing) return fail('Nama atau kode departemen sudah digunakan', 'DUPLICATE')

    const dept = await prisma.department.create({ data: parsed.data })

    await createAuditLog(session.id, session.username, 'CREATE', 'department', dept.id, { name: dept.name, code: dept.code })
    revalidatePath('/admin/departments')
    return ok({ id: dept.id }, `Departemen ${dept.name} berhasil dibuat`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail(e.message ?? 'Unauthorized', 'UNAUTHORIZED')
    logger.error('createDepartment failed', { error: String(error) })
    return fail('Gagal membuat departemen', 'SERVER_ERROR')
  }
}

export async function updateDepartment(id: string, formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()
    const raw = { name: formData.get('name')?.toString().trim() ?? '', code: formData.get('code')?.toString().trim().toUpperCase() ?? '' }

    const parsed = departmentSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Data tidak valid', 'VALIDATION')
    }

    const existing = await prisma.department.findFirst({
      where: { OR: [{ name: parsed.data.name }, { code: parsed.data.code }], NOT: { id } },
    })
    if (existing) return fail('Nama atau kode sudah digunakan departemen lain', 'DUPLICATE')

    await prisma.department.update({ where: { id }, data: parsed.data })
    await createAuditLog(session.id, session.username, 'UPDATE', 'department', id, { name: parsed.data.name, code: parsed.data.code })
    revalidatePath('/admin/departments')
    return ok({ id }, `Departemen diperbarui`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail(e.message ?? 'Unauthorized', 'UNAUTHORIZED')
    logger.error('updateDepartment failed', { error: String(error) })
    return fail('Gagal memperbarui departemen', 'SERVER_ERROR')
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()

    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    })
    if (!dept) return fail('Departemen tidak ditemukan', 'NOT_FOUND')
    if (dept._count.employees > 0) {
      return fail(`Tidak bisa menghapus — masih ada ${dept._count.employees} karyawan`, 'VALIDATION')
    }

    await prisma.department.delete({ where: { id } })
    await createAuditLog(session.id, session.username, 'DELETE', 'department', id, { name: dept.name })
    revalidatePath('/admin/departments')
    return ok({ id }, `Departemen ${dept.name} dihapus`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail(e.message ?? 'Unauthorized', 'UNAUTHORIZED')
    logger.error('deleteDepartment failed', { error: String(error) })
    return fail('Gagal menghapus departemen', 'SERVER_ERROR')
  }
}
