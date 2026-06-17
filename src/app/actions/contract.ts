'use server'

import { prisma } from '@/lib/prisma'
import { differenceInDays, startOfDay } from 'date-fns'
import { logger } from '@/lib/logger'

export type ContractRow = {
  id: string
  posisi: string
  traineeSejak: Date
  traineeSelesai: Date
  employeeId: string
  employeeName: string
  employeeCabang: string
  employeeStatus: string
  daysLeft: number
  contractStatus: 'expired' | 'critical' | 'warning' | 'safe'
}

export async function getContracts({
  search = '',
  cabang = '',
  status = '',
  page = 1,
  perPage = 15,
}: {
  search?: string
  cabang?: string
  status?: string // expired | critical | warning | safe | ''
  page?: number
  perPage?: number
} = {}): Promise<{ contracts: ContractRow[]; total: number }> {
  try {
    const today = startOfDay(new Date())

    // Get latest contract per AKTIF employee
    const allContracts = await prisma.contract.findMany({
      where: {
        employee: {
          status: 'AKTIF',
          AND: [
            search ? { OR: [{ namaLengkap: { contains: search } }, { nik: { contains: search } }] } : {},
            cabang ? { cabang } : {},
          ],
        },
      },
      orderBy: { traineeSelesai: 'desc' },
      distinct: ['employeeId'],
      include: {
        employee: { select: { id: true, namaLengkap: true, cabang: true, status: true } },
      },
    })

    // Map to ContractRow with computed fields
    const rows: ContractRow[] = allContracts.map(c => {
      const days = differenceInDays(new Date(c.traineeSelesai), today)
      let contractStatus: ContractRow['contractStatus']
      if (days < 0) contractStatus = 'expired'
      else if (days <= 30) contractStatus = 'critical'
      else if (days <= 90) contractStatus = 'warning'
      else contractStatus = 'safe'

      return {
        id: c.id,
        posisi: c.posisi,
        traineeSejak: c.traineeSejak,
        traineeSelesai: c.traineeSelesai,
        employeeId: c.employee.id,
        employeeName: c.employee.namaLengkap,
        employeeCabang: c.employee.cabang,
        employeeStatus: c.employee.status,
        daysLeft: days,
        contractStatus,
      }
    })

    // Filter by contract status
    const filtered = status ? rows.filter(r => r.contractStatus === status) : rows

    // Sort: expired first, then by days ascending
    filtered.sort((a, b) => a.daysLeft - b.daysLeft)

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    return { contracts: paginated, total }
  } catch (error) {
    logger.error('getContracts failed', { error: String(error) })
    return { contracts: [], total: 0 }
  }
}

export async function getContractStats() {
  try {
    const today = startOfDay(new Date())
    const contracts = await prisma.contract.findMany({
      where: { employee: { status: 'AKTIF' } },
      orderBy: { traineeSelesai: 'desc' },
      distinct: ['employeeId'],
      select: { traineeSelesai: true },
    })

    let expired = 0, critical = 0, warning = 0, safe = 0
    contracts.forEach(c => {
      const days = differenceInDays(new Date(c.traineeSelesai), today)
      if (days < 0) expired++
      else if (days <= 30) critical++
      else if (days <= 90) warning++
      else safe++
    })

    return { total: contracts.length, expired, critical, warning, safe }
  } catch (error) {
    logger.error('getContractStats failed', { error: String(error) })
    return { total: 0, expired: 0, critical: 0, warning: 0, safe: 0 }
  }
}
