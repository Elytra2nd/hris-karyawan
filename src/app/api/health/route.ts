import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// Endpoint PUBLIK (dipakai uptime monitor). Balas seminimal mungkin: status +
// keterjangkauan DB. Detail internal (versi Node, path temp, isi log server)
// TIDAK boleh keluar dari sini — baca log lewat SSH, bukan lewat HTTP.
export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      dbMs: Date.now() - start,
      ts: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('health check failed', { error: String(error) })
    return NextResponse.json(
      { status: 'error', db: 'unreachable', ts: new Date().toISOString() },
      { status: 503 },
    )
  }
}
