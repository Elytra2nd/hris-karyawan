'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { differenceInDays } from 'date-fns'

export interface ExpiringContract {
  id: string
  employeeId: string
  namaLengkap: string
  cabang: string
  posisi: string
  traineeSelesai: string
  daysLeft: number
}

export interface NotificationSummary {
  critical: ExpiringContract[]  // ≤ 14 hari
  warning: ExpiringContract[]   // 15–30 hari
  approaching: ExpiringContract[] // 31–60 hari
  totalUnread: number
}

export async function getNotifications(): Promise<NotificationSummary> {
  await verifySession()

  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() + 60)

  const contracts = await prisma.contract.findMany({
    where: {
      traineeSelesai: { gte: now, lte: cutoff },
      employee: { status: 'AKTIF' },
    },
    orderBy: { traineeSelesai: 'asc' },
    distinct: ['employeeId'],
    include: {
      employee: { select: { namaLengkap: true, cabang: true, id: true } },
    },
    take: 50,
  })

  const mapped: ExpiringContract[] = contracts.map(c => ({
    id: c.id,
    employeeId: c.employee.id,
    namaLengkap: c.employee.namaLengkap,
    cabang: c.employee.cabang,
    posisi: c.posisi,
    traineeSelesai: c.traineeSelesai.toISOString(),
    daysLeft: differenceInDays(new Date(c.traineeSelesai), now),
  }))

  const critical = mapped.filter(c => c.daysLeft <= 14)
  const warning = mapped.filter(c => c.daysLeft > 14 && c.daysLeft <= 30)
  const approaching = mapped.filter(c => c.daysLeft > 30)

  return {
    critical,
    warning,
    approaching,
    totalUnread: critical.length + warning.length,
  }
}
