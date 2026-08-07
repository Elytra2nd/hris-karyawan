import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { readFile } from 'fs/promises'
import { join, extname, normalize, sep } from 'path'
import { NextRequest, NextResponse } from 'next/server'

const PRIVATE_BASE = join(process.cwd(), 'private_uploads')

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await params

  // Scan KTP/KK = data pribadi peka. Nama file memuat employeeId yang muncul di
  // respons daftar, jadi "tahu URL" bukan kontrol akses: batasi ke role yang
  // memang mengurus berkas. Foto profil tetap terbuka untuk semua sesi.
  if (path[0] === 'documents' && !hasPermission(session.user.role, 'upload_photo')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Prevent path traversal: normalize and ensure it stays within PRIVATE_BASE
  const relative = normalize(path.join('/'))
  if (relative.includes('..')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const filePath = join(PRIVATE_BASE, relative)
  const baseWithSep = PRIVATE_BASE.endsWith(sep) ? PRIVATE_BASE : PRIVATE_BASE + sep
  if (!filePath.startsWith(baseWithSep)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const buffer = await readFile(filePath)
    const ext = extname(filePath).toLowerCase()
    const contentType = MIME[ext] ?? 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        // Gambar boleh inline (preview). PDF dipaksa attachment: PDF bisa memuat
        // skrip, dan inline di origin yang sama membuatnya jalan sebagai kita.
        'Content-Disposition': ext === '.pdf' ? 'attachment' : 'inline',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
  }
}
