import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
    return NextResponse.json(
      { status: 'error', db: 'unreachable', error: String(error) },
      { status: 503 }
    )
  }
}
