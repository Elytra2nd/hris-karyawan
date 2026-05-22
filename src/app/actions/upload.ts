'use server'

import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requirePermission } from "@/lib/auth-guard"
import { logger } from '@/lib/logger'

const PRIVATE_BASE = join(process.cwd(), 'private_uploads')
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadEmployeePhoto(formData: FormData, employeeId: string) {
  try {
    await requireAdmin()

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { success: false, message: 'File tidak valid' }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, message: 'Hanya format JPG, PNG, atau WEBP yang diizinkan' }
    }
    if (file.size > MAX_BYTES) {
      return { success: false, message: 'Ukuran file maksimal 2 MB' }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { image: true },
    })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(PRIVATE_BASE, 'profiles')
    await mkdir(uploadDir, { recursive: true })

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
    const fileName = `${employeeId}_${Date.now()}.${ext}`
    await writeFile(join(uploadDir, fileName), buffer)

    // Stored as /api/files/profiles/... — served by auth-gated API route
    const relativePath = `/api/files/profiles/${fileName}`

    await prisma.employee.update({
      where: { id: employeeId },
      data: { image: relativePath },
    })

    // Clean up previous file
    if (employee?.image) {
      const oldRelative = employee.image
        .replace('/api/files/', '')
        .replace('/uploads/profiles/', 'profiles/')  // handle legacy public paths
      try {
        await unlink(join(PRIVATE_BASE, oldRelative))
      } catch {
        // Already deleted or migrated — not an error
      }
    }

    revalidatePath(`/karyawan/${employeeId}`)
    return { success: true, url: relativePath }
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string }
    if (e?.code === 'UNAUTHORIZED') return { success: false, message: e.message }
    logger.error('uploadEmployeePhoto failed', { employeeId, error: String(error) })
    return { success: false, message: 'Gagal memproses unggahan' }
  }
}
