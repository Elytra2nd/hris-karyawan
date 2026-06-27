import { prisma } from '@/lib/prisma'
import { NextResponse, type NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import fs from 'fs'
import os from 'os'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret && secret === process.env.NEXTAUTH_SECRET) {
    try {
      const logPaths = [
        '/home/astratra/logs/astratraineemonitoringsystem.com.error.log',
        '/home/astratra/astratraineemonitoringsystem.com/logs/astratraineemonitoringsystem.com.error.log',
        'logs/astratraineemonitoringsystem.com.error.log',
        '../logs/astratraineemonitoringsystem.com.error.log'
      ]
      let logs = ''
      let foundPath = ''
      for (const logPath of logPaths) {
        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath)
          const size = stats.size
          const stream = fs.createReadStream(logPath, {
            start: Math.max(0, size - 25000), // ambil 25KB log terakhir
            end: size
          })
          logs = await new Promise<string>((resolve, reject) => {
            let chunk = ''
            stream.on('data', c => chunk += c.toString())
            stream.on('end', () => resolve(chunk))
            stream.on('error', e => reject(e))
          })
          foundPath = logPath
          break
        }
      }
      if (!logs) {
        return NextResponse.json({ error: 'Log files not found or empty', tried: logPaths })
      }
      return new NextResponse(logs, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    } catch (e: any) {
      return NextResponse.json({ error: e.message })
    }
  }

  const start = Date.now()

  // Diagnostics for temp folder
  const tempDir = os.tmpdir()
  let tempWriteable = false
  try {
    const testFile = `${tempDir}/test-write-${Date.now()}.txt`
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    tempWriteable = true
  } catch (e) {
    tempWriteable = false
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    const dbMs = Date.now() - start

    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      dbMs,
      ts: new Date().toISOString(),
      diagnostics: {
        tempDir,
        tempWriteable,
        envTmpDir: process.env.TMPDIR || 'not set',
        nodeVersion: process.version
      }
    })
  } catch (error) {
    // Detail error hanya di log server - jangan bocorkan ke endpoint publik.
    logger.error('health check failed', { error: String(error) })
    return NextResponse.json(
      { 
        status: 'error', 
        db: 'unreachable', 
        ts: new Date().toISOString(),
        diagnostics: {
          tempDir,
          tempWriteable,
          envTmpDir: process.env.TMPDIR || 'not set',
          nodeVersion: process.version
        }
      },
      { status: 503 }
    )
  }
}
