'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { requireAdmin } from '@/lib/auth-guard'
import { ok, fail, type ActionResult } from '@/lib/result'
import { logger } from '@/lib/logger'
import { createAuditLog } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
  newPassword: z
    .string()
    .min(8, 'Password baru minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus mengandung minimal 1 huruf kapital')
    .regex(/[0-9]/, 'Password harus mengandung minimal 1 angka'),
  confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
})

export async function changeOwnPassword(formData: FormData): Promise<ActionResult<void>> {
  try {
    const session = await verifySession()

    const raw = {
      currentPassword: formData.get('currentPassword')?.toString() ?? '',
      newPassword: formData.get('newPassword')?.toString() ?? '',
      confirmPassword: formData.get('confirmPassword')?.toString() ?? '',
    }

    const parsed = changePasswordSchema.safeParse(raw)
    if (!parsed.success) {
      const fields: Record<string, string> = {}
      parsed.error.issues.forEach(e => { fields[e.path[0] as string] = e.message })
      return fail(parsed.error.issues[0]?.message ?? 'Ada isian yang belum lengkap', 'VALIDATION', fields)
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } })
    if (!user) return fail('Sesi Anda sudah kedaluwarsa — silakan login ulang', 'NOT_FOUND')

    const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password)
    if (!isValid) {
      return fail('Password saat ini tidak sesuai', 'VALIDATION', { currentPassword: 'Password saat ini tidak sesuai' })
    }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 10)
    await prisma.user.update({ where: { id: session.id }, data: { password: hashed } })

    await createAuditLog(session.id, session.username, 'UPDATE', 'user', session.id, { action: 'change_password' })

    return ok(undefined, 'Password berhasil diubah')
  } catch (error: unknown) {
    logger.error('changeOwnPassword failed', { error: String(error) })
    return fail('Kami belum bisa mengubah password — coba simpan ulang', 'SERVER_ERROR')
  }
}

export async function adminResetPassword(
  userId: string,
  newPassword: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireAdmin()

    const pwSchema = z.string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus mengandung huruf kapital')
      .regex(/[0-9]/, 'Harus mengandung angka')

    const validated = pwSchema.safeParse(newPassword)
    if (!validated.success) {
      return fail(validated.error.issues[0]?.message ?? 'Password belum memenuhi persyaratan', 'VALIDATION')
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return fail('Pengguna tidak ditemukan — mungkin sudah dihapus', 'NOT_FOUND')

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    await createAuditLog(
      session.id, session.username,
      'UPDATE', 'user', userId,
      { action: 'admin_reset_password', targetUser: user.username }
    )

    return ok(undefined, `Password ${user.username} berhasil direset`)
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return fail('Anda tidak memiliki izin — hubungi Admin', 'UNAUTHORIZED')
    logger.error('adminResetPassword failed', { userId, error: String(error) })
    return fail('Kami belum bisa mereset password — coba ulangi', 'SERVER_ERROR')
  }
}
