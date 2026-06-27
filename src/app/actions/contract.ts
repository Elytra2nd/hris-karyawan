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
  posisi = '',
  page = 1,
  perPage = 15,
  sortBy = '',
  sortDir = 'asc',
}: {
  search?: string
  cabang?: string
  status?: string // expired | critical | warning | safe | ''
  posisi?: string
  page?: number
  perPage?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
} = {}): Promise<{ contracts: ContractRow[]; total: number }> {
  try {
    const today = startOfDay(new Date())

    // Get latest contract per AKTIF employee
    const allContracts = await prisma.contract.findMany({
      where: {
        ...(posisi ? { posisi } : {}),
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

    // Sort lintas seluruh dataset (bukan per halaman). Default: paling mendesak dulu.
    if (sortBy) {
      const dir = sortDir === 'desc' ? -1 : 1
      filtered.sort((a, b) => {
        let va: string, vb: string
        if (sortBy === 'traineeSelesai') {
          va = new Date(a.traineeSelesai).toISOString()
          vb = new Date(b.traineeSelesai).toISOString()
        } else {
          va = String((a as Record<string, unknown>)[sortBy] ?? '')
          vb = String((b as Record<string, unknown>)[sortBy] ?? '')
        }
        va = va.toLowerCase(); vb = vb.toLowerCase()
        if (va < vb) return -1 * dir
        if (va > vb) return 1 * dir
        return 0
      })
    } else {
      filtered.sort((a, b) => a.daysLeft - b.daysLeft)
    }

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * perPage, page * perPage)

    return { contracts: paginated, total }
  } catch (error) {
    logger.error('getContracts failed', { error: String(error) })
    return { contracts: [], total: 0 }
  }
}

export async function getContractStats({
  search = '',
  cabang = '',
  posisi = '',
}: {
  search?: string
  cabang?: string
  posisi?: string
} = {}) {
  try {
    const today = startOfDay(new Date())
    const contracts = await prisma.contract.findMany({
      where: {
        ...(posisi ? { posisi } : {}),
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

/** Get distinct posisi values from contracts for filter dropdown */
export async function getDistinctPosisi(): Promise<string[]> {
  try {
    const result = await prisma.contract.findMany({
      where: { employee: { status: 'AKTIF' } },
      select: { posisi: true },
      distinct: ['posisi'],
      orderBy: { posisi: 'asc' },
    })
    return result.map(r => r.posisi)
  } catch {
    return []
  }
}
