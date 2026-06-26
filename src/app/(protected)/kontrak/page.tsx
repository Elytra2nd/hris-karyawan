'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getContracts, getContractStats, getDistinctPosisi } from '@/app/actions/contract'
import { getDistinctCabang } from '@/app/actions/employee'
import { getDepartments } from '@/app/actions/department'
import type { ContractRow } from '@/app/actions/contract'
import {
  MagnifyingGlass, XCircle, Warning, Clock, CheckCircle,
  ShieldWarning, Eye, FileText,
  ArrowsDownUp, ArrowUp, ArrowDown, Sliders, User,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { NativeSelect } from '@/components/ui/native-select'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { useDebounce } from '@/hooks/use-debounce'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PER_PAGE = 15
type SortKey = 'employeeName' | 'posisi' | 'employeeCabang' | 'traineeSelesai' | ''

// Dideklarasikan di module-level (bukan dalam render) agar tidak reset tiap render
function SortIcon({ col, sortCol, sortDir }: { col: SortKey; sortCol: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortCol !== col) return <ArrowsDownUp size={12} className="ml-1 text-muted-foreground/50 inline-block" />
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="ml-1 text-primary inline-block" />
    : <ArrowDown size={12} className="ml-1 text-primary inline-block" />
}

export default function ManajemenKontrakPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [contracts, setContracts] = useState<ContractRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, expired: 0, critical: 0, warning: 0, safe: 0 })
  const [loading, setLoading] = useState(true)

  // URL-driven filter state
  const urlSearch = searchParams.get('search') ?? ''
  const cabang = searchParams.get('cabang') ?? ''
  const status = searchParams.get('status') ?? ''
  const departmentFilter = searchParams.get('dept') ?? ''
  const posisiFilter = searchParams.get('posisi') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  // Local UI state
  const [sortCol, setSortCol] = useState<SortKey>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showFilter, setShowFilter] = useState(false)
  const [cabangOptions, setCabangOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string }[]>([])
  const [posisiOptions, setPosisiOptions] = useState<string[]>([])

  // Input search pakai state lokal (responsif instan), lalu di-debounce
  const [searchInput, setSearchInput] = useState(urlSearch)
  const debouncedSearch = useDebounce(searchInput, 300)

  // Sinkronkan hasil debounce ke URL pakai replace (tanpa spam history + tanpa input lag)
  useEffect(() => {
    if (debouncedSearch === urlSearch) return
    const params = new URLSearchParams(searchParams)
    if (debouncedSearch) params.set('search', debouncedSearch)
    else params.delete('search')
    params.set('page', '1')
    router.replace(`?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    })
    // Reset to page 1 when filter changes
    if (updates.search !== undefined || updates.status !== undefined || updates.cabang !== undefined || updates.dept !== undefined || updates.posisi !== undefined) {
      params.set('page', '1')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Fetch data. Flag `ignore` mencegah respons lama (out-of-order) menimpa yang baru.
  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      setLoading(true)
      const [result, statsResult] = await Promise.all([
        getContracts({ search: debouncedSearch, cabang, status, departmentId: departmentFilter, posisi: posisiFilter, page, perPage: PER_PAGE, sortBy: sortCol, sortDir }),
        getContractStats({ search: debouncedSearch, cabang, departmentId: departmentFilter, posisi: posisiFilter }),
      ])
      if (ignore) return
      setContracts(result.contracts)
      setTotal(result.total)
      setStats(statsResult)
      setLoading(false)
    }
    fetchData()
    return () => { ignore = true }
  }, [debouncedSearch, cabang, status, departmentFilter, posisiFilter, page, sortCol, sortDir])

  // Load filter options once on mount
  useEffect(() => { getDistinctCabang().then(setCabangOptions).catch(() => setCabangOptions([])) }, [])
  useEffect(() => { getDepartments().then(depts => setDepartmentOptions(depts.map(d => ({ id: d.id, name: d.name })))).catch(() => setDepartmentOptions([])) }, [])
  useEffect(() => { getDistinctPosisi().then(setPosisiOptions).catch(() => setPosisiOptions([])) }, [])

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

  // Sort dilakukan di server (lintas seluruh dataset, bukan hanya halaman aktif)
  const rows = contracts

  const handleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }


  const getStatusBadge = (row: ContractRow) => {
    switch (row.contractStatus) {
      case 'expired':
        return <span className="chip-expired">Expired</span>
      case 'critical':
        return <span className="chip-warning">Kritis · {row.daysLeft}h</span>
      case 'warning':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">{row.daysLeft}h lagi</span>
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

  const hasActiveFilters = cabang || departmentFilter || posisiFilter

  return (
    <div className="max-w-5xl mx-auto space-y-6">

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
          status === 'expired' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50' :
          status === 'critical' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' :
          status === 'warning' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50' :
          'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50'
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

      {/* ─── Posisi Filter Banner ─── */}
      {posisiFilter && (
        <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-3 bg-accent border-primary/20">
          <p className="text-sm font-semibold text-primary truncate">
            Posisi: <span className="font-bold">{posisiFilter}</span>
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">({total} kontrak)</span>
          </p>
          <button
            onClick={() => updateParams({ posisi: '' })}
            className="shrink-0 text-xs font-semibold text-foreground/70 hover:text-foreground px-2 py-1 rounded border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-2"
          >
            <XCircle size={12} />
            Hapus Filter
          </button>
        </div>
      )}

      {/* ─── Search + Sort + Funnel Toolbar ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama atau NIK karyawan..."
              aria-label="Cari kontrak"
              className="w-full h-8 pl-8 pr-4 text-base sm:text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70">
                <XCircle size={16} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-2 h-8 px-4 text-sm border rounded-md transition-colors',
                sortCol
                  ? 'border-primary text-primary bg-accent font-semibold'
                  : 'border-border text-foreground/70 bg-card hover:bg-muted/50'
              )}>
                <ArrowsDownUp size={16} />
                Urutkan
                {sortCol && <span className="ml-1 text-xs">({sortCol === 'employeeName' ? 'Nama' : sortCol === 'traineeSelesai' ? 'Tgl Selesai' : sortCol === 'employeeCabang' ? 'Cabang' : sortCol})</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {[
                { key: 'employeeName', label: 'Nama Karyawan' },
                { key: 'posisi', label: 'Posisi' },
                { key: 'employeeCabang', label: 'Cabang' },
                { key: 'traineeSelesai', label: 'Tanggal Selesai' },
              ].map(({ key, label }) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => handleSort(key as SortKey)}
                  className="cursor-pointer text-sm justify-between"
                >
                  {label}
                  {sortCol === key && (
                    <span className="text-primary font-bold">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => { setSortCol(''); setSortDir('asc') }}
                className="cursor-pointer text-sm text-muted-foreground"
              >
                Reset urutan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Funnel toggle */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center gap-2 h-8 px-4 text-sm border rounded-md transition-colors',
              showFilter
                ? 'border-primary text-primary bg-accent font-semibold'
                : 'border-border text-foreground/70 bg-card hover:bg-muted/50'
            )}
          >
            <Sliders size={16} />
            Funnel
            {hasActiveFilters && (
              <span className="h-2 w-2 rounded-full bg-primary ml-0.5" />
            )}
          </button>
        </div>

        {/* Funnel Panel */}
        {showFilter && (
          <div className="flex flex-wrap gap-6 px-4 py-4 rounded-md bg-muted/50 border border-border items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Cabang</label>
              <NativeSelect
                value={cabang}
                onChange={(e) => updateParams({ cabang: e.target.value })}
                aria-label="Filter cabang"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Departemen</label>
              <NativeSelect
                value={departmentFilter}
                onChange={(e) => updateParams({ dept: e.target.value })}
                aria-label="Filter departemen"
              >
                <option value="">Semua Departemen</option>
                {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Posisi</label>
              <NativeSelect
                value={posisiFilter}
                onChange={(e) => updateParams({ posisi: e.target.value })}
                aria-label="Filter posisi"
              >
                <option value="">Semua Posisi</option>
                {posisiOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </NativeSelect>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => updateParams({ cabang: '', dept: '', posisi: '' })}
                className="h-8 px-4 text-xs font-semibold text-muted-foreground hover:text-red-600 border border-border rounded-md bg-card hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Contract Table (Desktop) ─── */}
      <div className="hidden md:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-accent/60">
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('employeeName')}
                >
                  Karyawan <SortIcon col="employeeName" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('posisi')}
                >
                  Posisi <SortIcon col="posisi" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('employeeCabang')}
                >
                  Cabang <SortIcon col="employeeCabang" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Mulai
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('traineeSelesai')}
                >
                  Selesai <SortIcon col="traineeSelesai" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Status
                </th>
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
              ) : rows.length === 0 ? (
                <EmptyState
                  asTableRow
                  colSpan={7}
                  icon={searchInput || status || hasActiveFilters ? MagnifyingGlass : FileText}
                  title={searchInput || status || hasActiveFilters ? 'Tidak ada kontrak ditemukan' : 'Belum ada data kontrak'}
                  description={searchInput || status || hasActiveFilters ? 'Coba ubah filter atau kata kunci' : 'Kontrak akan muncul setelah karyawan ditambahkan'}
                />
              ) : (
                rows.map((row) => (
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

      {/* ─── Mobile Card View ─── */}
      <div className="md:hidden bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={searchInput || status || hasActiveFilters ? MagnifyingGlass : FileText}
            title={searchInput || status || hasActiveFilters ? 'Tidak ada kontrak ditemukan' : 'Belum ada data kontrak'}
            description={searchInput || status || hasActiveFilters ? 'Coba ubah filter atau kata kunci' : 'Kontrak akan muncul setelah karyawan ditambahkan'}
          />
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/karyawan/${row.employeeId}/kontrak`}
                className={cn(
                  'flex items-start gap-3 px-4 py-4 hover:bg-muted/50 transition-colors',
                  row.contractStatus === 'expired' && 'bg-red-50/30',
                  row.contractStatus === 'critical' && 'bg-amber-50/30',
                )}
              >
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <User size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{row.employeeName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{row.posisi} · {row.employeeCabang}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getStatusBadge(row)}
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(row.traineeSejak)} – {fmtDate(row.traineeSelesai)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Hal {page}/{totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { if (page > 1) updateParams({ page: String(page - 1) }) }}
                disabled={page <= 1}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-card text-foreground/70 disabled:opacity-40 hover:bg-muted/50 transition-colors"
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>
              <button
                onClick={() => { if (page < totalPages) updateParams({ page: String(page + 1) }) }}
                disabled={page >= totalPages}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-card text-foreground/70 disabled:opacity-40 hover:bg-muted/50 transition-colors"
                aria-label="Halaman berikutnya"
              >
                ›
              </button>
            </div>
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
