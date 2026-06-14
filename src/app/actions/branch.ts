'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth-guard'
import { createAuditLog } from '@/lib/audit'
import { ok, fail, type ActionResult } from '@/lib/result'
import { logger } from '@/lib/logger'
import { branchSchema } from '@/lib/validation'

export async function getBranches() {
  try {
    return await prisma.branch.findMany({
      orderBy: { code: 'asc' },
      include: { _count: { select: { employees: true } } },
    })
  } catch {
    return []
  }
}

export async function createBranch(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()
    const raw = {
      code: formData.get('code')?.toString().trim().toUpperCase() ?? '',
      label: formData.get('label')?.toString().trim().toUpperCase() ?? '',
    }

    const parsed = branchSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap — periksa kembali', 'VALIDATION')
    }

    const existing = await prisma.branch.findFirst({
      where: { OR: [{ code: parsed.data.code }, { label: parsed.data.label }] },
    })
    if (existing) return fail('Kode atau nama cabang sudah dipakai — gunakan yang berbeda', 'DUPLICATE')

    const branch = await prisma.branch.create({ data: parsed.data })

    await createAuditLog(session.id, session.username, 'CREATE', 'branch', branch.id, { code: branch.code, label: branch.label })
    revalidatePath('/admin/branches')
    return ok({ id: branch.id }, `Cabang ${branch.label} berhasil dibuat`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin — hubungi Admin', 'UNAUTHORIZED')
    logger.error('createBranch failed', { error: String(error) })
    return fail('Kami belum bisa membuat cabang — coba kirim ulang', 'SERVER_ERROR')
  }
}

export async function updateBranch(id: string, formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()
    const raw = {
      code: formData.get('code')?.toString().trim().toUpperCase() ?? '',
      label: formData.get('label')?.toString().trim().toUpperCase() ?? '',
    }

    const parsed = branchSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap — periksa kembali', 'VALIDATION')
    }

    const existing = await prisma.branch.findFirst({
      where: { OR: [{ code: parsed.data.code }, { label: parsed.data.label }], NOT: { id } },
    })
    if (existing) return fail('Kode atau nama cabang sudah dipakai — gunakan yang berbeda', 'DUPLICATE')

    await prisma.branch.update({ where: { id }, data: parsed.data })
    await createAuditLog(session.id, session.username, 'UPDATE', 'branch', id, { code: parsed.data.code, label: parsed.data.label })
    revalidatePath('/admin/branches')
    return ok({ id }, 'Cabang diperbarui')
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin — hubungi Admin', 'UNAUTHORIZED')
    logger.error('updateBranch failed', { error: String(error) })
    return fail('Kami belum bisa menyimpan perubahan — coba simpan ulang', 'SERVER_ERROR')
  }
}

export async function deleteBranch(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    })
    if (!branch) return fail('Cabang tidak ditemukan — mungkin sudah dihapus', 'NOT_FOUND')
    if (branch._count.employees > 0) {
      return fail(`Cabang ini masih memiliki ${branch._count.employees} karyawan — pindahkan mereka terlebih dahulu`, 'VALIDATION')
    }

    await prisma.branch.delete({ where: { id } })
    await createAuditLog(session.id, session.username, 'DELETE', 'branch', id, { code: branch.code, label: branch.label })
    revalidatePath('/admin/branches')
    return ok({ id }, `Cabang ${branch.label} dihapus`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin — hubungi Admin', 'UNAUTHORIZED')
    logger.error('deleteBranch failed', { error: String(error) })
    return fail('Kami belum bisa menghapus cabang — coba ulangi', 'SERVER_ERROR')
  }
}
