'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getContracts, getContractStats } from '@/app/actions/contract'
import type { ContractRow } from '@/app/actions/contract'
import {
  MagnifyingGlass, XCircle, Warning, Clock, CheckCircle,
  ShieldWarning, CaretLeft, CaretRight, Eye, FileText,
  ArrowsDownUp, Sliders, User,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { useDebounce } from '@/hooks/use-debounce'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination'

const PER_PAGE = 15

export default function ManajemenKontrakPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, expired: 0, critical: 0, warning: 0, safe: 0 })
  const [loading, setLoading] = useState(true)

  const search = searchParams.get('search') ?? ''
  const cabang = searchParams.get('cabang') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  const debouncedSearch = useDebounce(search, 300)

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    })
    if (updates.search !== undefined || updates.status !== undefined || updates.cabang !== undefined) {
      params.set('page', '1')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [result, statsResult] = await Promise.all([
        getContracts({ search: debouncedSearch, cabang, status, page, perPage: PER_PAGE }),
        getContractStats(),
      ])
      setContracts(result.contracts)
      setTotal(result.total)
      setStats(statsResult)
      setLoading(false)
    }
    fetchData()
  }, [debouncedSearch, cabang, status, page])

  const totalPages = Math.ceil(total / PER_PAGE)
  const fmtDate = (d: string | Date) => format(new Date(d), 'dd MMM yyyy', { locale: localeID })

  const pageNums = useMemo(() => {
    const p: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) p.push(i)
    } else {
      p.push(1)
      if (page > 3) p.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) p.push(i)
      if (page < totalPages - 2) p.push('...')
      p.push(totalPages)
    }
    return p
  }, [page, totalPages])

  const getStatusBadge = (row: ContractRow) => {
    switch (row.contractStatus) {
      case 'expired':
        return <span className="chip-expired">Expired</span>
      case 'critical':
        return <span className="chip-warning">Kritis · {row.daysLeft}h</span>
      case 'warning':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{row.daysLeft}h lagi</span>
      case 'safe':
        return <span className="chip-aktif">Aman · {row.daysLeft}h</span>
    }
  }

  const activeStatusLabel: Record<string, string> = {
    expired: 'Kontrak Expired',
    critical: 'Kritis (≤ 30 hari)',
    warning: 'Perlu Perhatian (31–90 hari)',
    safe: 'Aman (> 90 hari)',
  }

  return (
    <div className="space-y-6">

      {/* ─── Page Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manajemen Kontrak</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Monitoring status kontrak seluruh karyawan aktif
        </p>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Kontrak"
          value={stats.total}
          icon={<FileText size={20} className="text-white" />}
          bg="bg-primary"
          textColor="text-blue-100"
          onClick={() => updateParams({ status: '' })}
          active={!status}
        />
        <StatCard
          label="Kontrak Aman"
          value={stats.safe}
          icon={<CheckCircle size={20} className="text-green-600" />}
          bg="bg-green-50"
          textColor="text-muted-foreground"
          onClick={() => updateParams({ status: 'safe' })}
          active={status === 'safe'}
        />
        <StatCard
          label="Perlu Perhatian"
          value={stats.warning}
          icon={<Clock size={20} className="text-blue-500" />}
          bg="bg-blue-50"
          textColor="text-muted-foreground"
          onClick={() => updateParams({ status: 'warning' })}
          active={status === 'warning'}
        />
        <StatCard
          label="Kritis ≤ 30h"
          value={stats.critical}
          icon={<Warning size={20} className="text-amber-500" />}
          bg="bg-amber-50"
          textColor="text-muted-foreground"
          onClick={() => updateParams({ status: 'critical' })}
          active={status === 'critical'}
          highlight={stats.critical > 0}
        />
        <StatCard
          label="Expired"
          value={stats.expired}
          icon={<ShieldWarning size={20} className="text-rose-500" />}
          bg="bg-rose-50"
          textColor="text-muted-foreground"
          onClick={() => updateParams({ status: 'expired' })}
          active={status === 'expired'}
          highlight={stats.expired > 0}
        />
      </div>

      {/* ─── Active Filter Banner ─── */}
      {status && (
        <div className={cn(
          'flex items-center justify-between gap-4 rounded-md border px-4 py-3',
          status === 'expired' ? 'bg-red-50 border-red-200' :
          status === 'critical' ? 'bg-amber-50 border-amber-200' :
          status === 'warning' ? 'bg-blue-50 border-blue-200' :
          'bg-green-50 border-green-200'
        )}>
          <p className="text-sm font-semibold">
            {activeStatusLabel[status]}
            <span className="ml-2 text-xs font-normal text-muted-foreground">({total} kontrak)</span>
          </p>
          <button
            onClick={() => updateParams({ status: '' })}
            className="shrink-0 text-xs font-semibold text-foreground/70 hover:text-foreground px-2 py-1 rounded border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-1"
          >
            <XCircle size={12} /> Reset
          </button>
        </div>
      )}

      {/* ─── Search ─── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => updateParams({ search: e.target.value })}
            placeholder="Cari nama karyawan..."
            aria-label="Cari kontrak"
            className="w-full h-9 pl-9 pr-4 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
          />
          {search && (
            <button onClick={() => updateParams({ search: '' })} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70">
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Contract Table ─── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-accent/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Karyawan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Posisi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Cabang</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Mulai</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Selesai</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                  </tr>
                ))
              ) : contracts.length === 0 ? (
                <EmptyState
                  asTableRow
                  colSpan={7}
                  icon={search || status ? MagnifyingGlass : FileText}
                  title={search || status ? 'Tidak ada kontrak ditemukan' : 'Belum ada data kontrak'}
                  description={search || status ? 'Coba ubah filter atau kata kunci' : 'Kontrak akan muncul setelah karyawan ditambahkan'}
                />
              ) : (
                contracts.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-muted/50 transition-colors group',
                      row.contractStatus === 'expired' && 'bg-red-50/30',
                      row.contractStatus === 'critical' && 'bg-amber-50/30',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <User size={14} className="text-primary" />
                        </div>
                        <Link
                          href={`/karyawan/${row.employeeId}`}
                          className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate"
                        >
                          {row.employeeName}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{row.posisi}</td>
                    <td className="px-4 py-3 text-sm text-foreground/80">{row.employeeCabang}</td>
                    <td className="px-4 py-3 text-sm text-foreground/70">{fmtDate(row.traineeSejak)}</td>
                    <td className={cn(
                      'px-4 py-3 text-sm font-medium',
                      row.contractStatus === 'expired' ? 'text-red-600' :
                      row.contractStatus === 'critical' ? 'text-amber-600' : 'text-foreground/80'
                    )}>
                      {fmtDate(row.traineeSelesai)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(row)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/karyawan/${row.employeeId}/kontrak`}
                        aria-label={`Kelola kontrak ${row.employeeName}`}
                        className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-400"
                      >
                        <Eye size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && !loading && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              {total === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)}`} dari{' '}
              <span className="font-semibold text-foreground/80">{total}</span> kontrak
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page > 1) updateParams({ page: String(page - 1) }) }}
                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {pageNums.map((p, i) =>
                  typeof p === 'number' ? (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={page === p}
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); updateParams({ page: String(p) }) }}
                        className="cursor-pointer"
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={i}><PaginationEllipsis /></PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e: React.MouseEvent) => { e.preventDefault(); if (page < totalPages) updateParams({ page: String(page + 1) }) }}
                    className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function StatCard({
  label, value, icon, bg, textColor, onClick, active, highlight,
}: {
  label: string
  value: number
  icon: React.ReactNode
  bg: string
  textColor: string
  onClick: () => void
  active: boolean
  highlight?: boolean
}) {
  const isPrimary = bg === 'bg-primary'
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg p-4 flex items-center gap-3 shadow-sm transition-all text-left w-full',
        active ? 'ring-2 ring-primary ring-offset-2' : '',
        isPrimary ? 'bg-primary hover:bg-primary/90' :
        highlight ? 'bg-card border border-amber-200 hover:shadow-md' :
        'bg-card border border-border hover:shadow-md hover:border-primary/30',
      )}
    >
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', bg)}>
        {icon}
      </div>
      <div>
        <p className={cn('text-2xl font-bold leading-snug', isPrimary ? 'text-white' : 'text-foreground')}>
          {value.toLocaleString('id-ID')}
        </p>
        <p className={cn('text-xs mt-0.5', textColor)}>{label}</p>
      </div>
    </button>
  )
}
