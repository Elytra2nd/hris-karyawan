'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth-guard'
import { createAuditLog } from '@/lib/audit'
import { ok, fail, type ActionResult } from '@/lib/result'
import { isUniqueViolation } from '@/lib/prisma-error'
import { logger } from '@/lib/logger'
import { positionSchema } from '@/lib/validation'

// Daftar posisi + jumlah kontrak yang memakainya (untuk UI + guard hapus).
export async function getPositions() {
  try {
    const positions = await prisma.position.findMany({ orderBy: { name: 'asc' } })
    const counts = await prisma.contract.groupBy({ by: ['posisi'], _count: { _all: true } })
    const countMap = new Map(counts.map(c => [c.posisi, c._count._all]))
    return positions.map(p => ({ ...p, _count: { contracts: countMap.get(p.name) ?? 0 } }))
  } catch {
    return []
  }
}

function parsePositionForm(formData: FormData) {
  return positionSchema.safeParse({
    name: formData.get('name')?.toString().trim().toUpperCase() ?? '',
    contractMonths: formData.get('contractMonths')?.toString() ?? '',
  })
}

export async function createPosition(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('position_manage')
    const parsed = parsePositionForm(formData)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali', 'VALIDATION')
    }

    const existing = await prisma.position.findUnique({ where: { name: parsed.data.name } })
    if (existing) return fail('Nama posisi ini sudah ada - gunakan nama lain', 'DUPLICATE')

    const pos = await prisma.position.create({ data: parsed.data })
    await createAuditLog(session.id, session.username, 'CREATE', 'position', pos.id, { name: pos.name, contractMonths: pos.contractMonths })
    revalidatePath('/admin/positions')
    return ok({ id: pos.id }, `Posisi ${pos.name} berhasil dibuat`)
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin - hubungi Admin', 'UNAUTHORIZED')
    if (isUniqueViolation(error)) return fail('Nama posisi ini sudah ada - gunakan nama lain', 'DUPLICATE')
    logger.error('createPosition failed', { error: String(error) })
    return fail('Kami belum bisa membuat posisi - coba kirim ulang', 'SERVER_ERROR')
  }
}

export async function updatePosition(id: string, formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('position_manage')
    const parsed = parsePositionForm(formData)
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap - periksa kembali', 'VALIDATION')
    }

    const current = await prisma.position.findUnique({ where: { id } })
    if (!current) return fail('Posisi tidak ditemukan - mungkin sudah dihapus', 'NOT_FOUND')

    const dup = await prisma.position.findFirst({ where: { name: parsed.data.name, NOT: { id } } })
    if (dup) return fail('Nama posisi ini sudah ada - gunakan nama lain', 'DUPLICATE')

    // Rename harus ikut memperbarui posisi pada kontrak (posisi disimpan sebagai string)
    await prisma.$transaction(async (tx) => {
      if (current.name !== parsed.data.name) {
        await tx.contract.updateMany({ where: { posisi: current.name }, data: { posisi: parsed.data.name } })
      }
      await tx.position.update({ where: { id }, data: parsed.data })
    })

    await createAuditLog(session.id, session.username, 'UPDATE', 'position', id, { name: parsed.data.name, contractMonths: parsed.data.contractMonths })
    revalidatePath('/admin/positions')
    return ok({ id }, 'Posisi diperbarui')
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin - hubungi Admin', 'UNAUTHORIZED')
    if (isUniqueViolation(error)) return fail('Nama posisi ini sudah ada - gunakan nama lain', 'DUPLICATE')
    logger.error('updatePosition failed', { error: String(error) })
    return fail('Kami belum bisa menyimpan perubahan - coba simpan ulang', 'SERVER_ERROR')
  }
}

export async function deletePosition(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requirePermission('position_manage')
    const pos = await prisma.position.findUnique({ where: { id } })
    if (!pos) return fail('Posisi tidak ditemukan - mungkin sudah dihapus', 'NOT_FOUND')

    const used = await prisma.contract.count({ where: { posisi: pos.name } })
    if (used > 0) {
      return fail(`Posisi ini masih dipakai ${used} kontrak - tidak bisa dihapus`, 'VALIDATION')
    }

    await prisma.position.delete({ where: { id } })
    await createAuditLog(session.id, session.username, 'DELETE', 'position', id, { name: pos.name })
    revalidatePath('/admin/positions')
    return ok({ id }, `Posisi ${pos.name} dihapus`)
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin - hubungi Admin', 'UNAUTHORIZED')
    logger.error('deletePosition failed', { error: String(error) })
    return fail('Kami belum bisa menghapus posisi - coba ulangi', 'SERVER_ERROR')
  }
}
