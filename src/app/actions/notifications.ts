'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { differenceInDays, startOfDay } from 'date-fns'

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
  expired: ExpiringContract[]     // sudah lewat
  critical: ExpiringContract[]    // ≤ 14 hari
  warning: ExpiringContract[]     // 15-30 hari
  approaching: ExpiringContract[] // 31-60 hari
  totalUnread: number
}

export async function getNotifications(): Promise<NotificationSummary> {
  await verifySession()

  const now = startOfDay(new Date())
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() + 60)

  const [upcomingContracts, expiredContracts] = await Promise.all([
    // Kontrak yang akan berakhir dalam 60 hari ke depan
    prisma.contract.findMany({
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
    }),

    // Kontrak expired — employee masih AKTIF tapi tidak punya kontrak aktif/mendatang
    prisma.contract.findMany({
      where: {
        traineeSelesai: { lt: now },
        employee: {
          status: 'AKTIF',
          contracts: { none: { traineeSelesai: { gte: now } } },
        },
      },
      orderBy: { traineeSelesai: 'desc' },
      distinct: ['employeeId'],
      include: {
        employee: { select: { namaLengkap: true, cabang: true, id: true } },
      },
      take: 30,
    }),
  ])

  const mapContract = (c: typeof upcomingContracts[number]): ExpiringContract => ({
    id: c.id,
    employeeId: c.employee.id,
    namaLengkap: c.employee.namaLengkap,
    cabang: c.employee.cabang,
    posisi: c.posisi,
    traineeSelesai: c.traineeSelesai.toISOString(),
    daysLeft: differenceInDays(c.traineeSelesai, now),
  })

  const expired = expiredContracts.map(mapContract)
  const upcoming = upcomingContracts.map(mapContract)

  const critical = upcoming.filter(c => c.daysLeft <= 14)
  const warning = upcoming.filter(c => c.daysLeft > 14 && c.daysLeft <= 30)
  const approaching = upcoming.filter(c => c.daysLeft > 30)

  return {
    expired,
    critical,
    warning,
    approaching,
    totalUnread: expired.length + critical.length + warning.length,
  }
}
