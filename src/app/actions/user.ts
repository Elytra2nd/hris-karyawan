'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth-guard'
import { createUserSchema, formDataToObject } from '@/lib/validation'
import { ok, fail, ActionResult } from '@/lib/result'
import { logger } from '@/lib/logger'
import { createAuditLog } from '@/lib/audit'

// ─── Get Users ────────────────────────────────────────────────────────────────
export async function getUsers() {
  try {
    await requireAdmin()
    return await prisma.user.findMany({
      select: { id: true, username: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch {
    return []
  }
}

// ─── Create User ──────────────────────────────────────────────────────────────
export async function createUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()

    const raw = formDataToObject(formData)
    const parsed = createUserSchema.safeParse(raw)

    if (!parsed.success) {
      const fields: Record<string, string> = {}
      parsed.error.issues.forEach(e => {
        const field = e.path[0] as string
        if (!fields[field]) fields[field] = e.message
      })
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap', 'VALIDATION', fields)
    }

    const { username, password, role } = parsed.data

    // Cek username sudah ada
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return fail('Username ini sudah dipakai — gunakan username lain', 'DUPLICATE', { username: 'Username ini sudah dipakai' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        username,
        password: hashedPassword,
        role,
      },
    })

    revalidatePath('/admin/users')
    await createAuditLog(session.id, session.username, 'CREATE', 'user', user.id, { username, role })
    return ok({ id: user.id }, `Akun ${username} berhasil dibuat`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin — hubungi Admin', 'UNAUTHORIZED')
    logger.error('createUser failed', { error: String(error) })
    return fail('Kami belum bisa membuat akun — coba kirim ulang', 'SERVER_ERROR')
  }
}

// ─── Delete User ──────────────────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAdmin()

    if (session.id === id) {
      return fail('Akun yang sedang login tidak bisa dihapus sendiri', 'VALIDATION')
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return fail('Pengguna tidak ditemukan — mungkin sudah dihapus', 'NOT_FOUND')
    }

    await prisma.user.delete({ where: { id } })

    revalidatePath('/admin/users')
    await createAuditLog(session.id, session.username, 'DELETE', 'user', id, { username: user.username, role: user.role })
    return ok({ id }, `Akun ${user.username} berhasil dihapus`)
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin — hubungi Admin', 'UNAUTHORIZED')
    logger.error('deleteUser failed', { error: String(error) })
    return fail('Kami belum bisa menghapus akun — coba ulangi', 'SERVER_ERROR')
  }
}
