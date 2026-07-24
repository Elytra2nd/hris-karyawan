import { prisma } from './prisma'
import { logger } from './logger'

export async function createAuditLog(
  userId: string,
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD', 
  entity: string,
  entityId: string,
  details: object
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        entity,
        entityId,
        details: JSON.stringify(details),
      },
    })
  } catch (error) {
    logger.error('createAuditLog failed', { entity, entityId, error: String(error) })
  }
}

// Versi massal untuk operasi batch (impor): satu INSERT untuk ratusan entri,
// bukan satu round-trip per baris. Gagal mencatat audit tidak boleh membatalkan
// operasi utamanya — sama seperti createAuditLog.
export async function createAuditLogs(
  entries: {
    userId: string
    userName: string
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD'
    entity: string
    entityId: string
    details: object
  }[],
) {
  if (entries.length === 0) return
  try {
    await prisma.auditLog.createMany({
      data: entries.map(e => ({ ...e, details: JSON.stringify(e.details) })),
    })
  } catch (error) {
    logger.error('createAuditLogs failed', { count: entries.length, error: String(error) })
  }
}
