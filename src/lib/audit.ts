import { prisma } from './prisma';

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
    });
  } catch (error) {
    // Kita gunakan console.error agar tidak menghentikan proses utama jika log gagal
    console.error("Gagal mencatat audit log:", error);
  }
}