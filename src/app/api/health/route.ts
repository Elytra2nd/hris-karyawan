import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const dbMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      dbMs,
      ts: new Date().toISOString(),
    })
  } catch (error) {
    // Detail error hanya di log server - jangan bocorkan ke endpoint publik.
    logger.error('health check failed', { error: String(error) })
    return NextResponse.json(
      { status: 'error', db: 'unreachable', ts: new Date().toISOString() },
      { status: 503 }
    )
  }
}
