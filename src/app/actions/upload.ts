'use server'

import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from "@/lib/auth-guard"
import { logger } from '@/lib/logger'

const PRIVATE_BASE = join(process.cwd(), 'private_uploads')
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

// MIME tepercaya → ekstensi. Ekstensi diturunkan dari hasil sniff, bukan nama file.
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// Deteksi tipe asli via magic-byte (header). Jangan percaya file.type dari client.
function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    return 'image/png'
  }
  // WEBP: "RIFF"...."WEBP"
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp'
  }
  return null
}

export async function uploadEmployeePhoto(formData: FormData, employeeId: string) {
  try {
    await requirePermission('upload_photo')

    const file = formData.get('file') as File
    if (!file || file.size === 0) return { success: false, message: 'Pilih file foto terlebih dahulu' }
    if (file.size > MAX_BYTES) {
      return { success: false, message: 'Ukuran foto terlalu besar — maksimal 2 MB' }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validasi berdasarkan isi file (magic-byte), bukan file.type yang bisa dipalsukan.
    const detectedMime = sniffImageMime(buffer)
    if (!detectedMime) {
      return { success: false, message: 'Format foto tidak didukung — gunakan JPG, PNG, atau WEBP' }
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { image: true },
    })
    if (!employee) {
      return { success: false, message: 'Data karyawan tidak ditemukan — mungkin sudah dihapus' }
    }

    const uploadDir = join(PRIVATE_BASE, 'profiles')
    await mkdir(uploadDir, { recursive: true })

    const ext = MIME_TO_EXT[detectedMime]
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
    if (e?.code === 'UNAUTHORIZED') return { success: false, message: 'Anda tidak memiliki izin mengunggah foto — hubungi Admin' }
    logger.error('uploadEmployeePhoto failed', { employeeId, error: String(error) })
    return { success: false, message: 'Kami belum bisa mengunggah foto — coba unggah ulang' }
  }
}
