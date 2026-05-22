import { prisma } from './prisma'
import { logger } from './logger'

export async function createAuditLog(
  userId: string,
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
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
