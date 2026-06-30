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

  // Ambil kontrak TERBARU (traineeSelesai paling akhir) per trainee AKTIF.
  // distinct + orderBy desc = baris dengan tanggal selesai terbesar per employeeId.
  // Status alert dihitung dari kontrak terbaru ini — konsisten dengan seluruh app,
  // mencegah false-positive saat trainee sudah diperpanjang lebih awal.
  const latestContracts = await prisma.contract.findMany({
    where: { employee: { status: 'AKTIF' } },
    orderBy: { traineeSelesai: 'desc' },
    distinct: ['employeeId'],
    include: {
      employee: { select: { namaLengkap: true, cabang: true, id: true } },
    },
  })

  const mapContract = (c: typeof latestContracts[number]): ExpiringContract => ({
    id: c.id,
    employeeId: c.employee.id,
    namaLengkap: c.employee.namaLengkap,
    cabang: c.employee.cabang,
    posisi: c.posisi,
    traineeSelesai: c.traineeSelesai.toISOString(),
    daysLeft: differenceInDays(c.traineeSelesai, now),
  })

  const items = latestContracts.map(mapContract)

  // Bucket berdasarkan kontrak terbaru: expired (sudah lewat) atau ≤ 60 hari ke depan
  const expired = items.filter(c => c.daysLeft < 0).sort((a, b) => a.daysLeft - b.daysLeft)
  const upcoming = items.filter(c => c.daysLeft >= 0 && c.daysLeft <= 60).sort((a, b) => a.daysLeft - b.daysLeft)

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
