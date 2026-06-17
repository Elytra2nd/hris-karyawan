'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getEmployees, getEmployeeStats, deleteEmployee, getDistinctCabang } from '@/app/actions/employee'
import { getDepartments } from '@/app/actions/department'
import type { Prisma } from '@prisma/client'

type EmployeeRow = Prisma.EmployeeGetPayload<{
  include: { contracts: true; department: true }
}>
import {
  CircleNotch, Eye, Pencil, ClockCounterClockwise, Trash, MagnifyingGlass,
  Sliders, ArrowsDownUp, ArrowUp, ArrowDown,
  Plus, DotsThreeVertical, CaretLeft, CaretRight,
  Download, User, XCircle, CheckCircle, Clock, Warning,
  Phone,
} from '@phosphor-icons/react'
import Link from 'next/link'
import { useSidebar } from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { ExportExcelButton } from '@/components/export-excel-button'
import { ImportExcelButton } from '@/components/import-excel-button'
import { useDebounce } from '@/hooks/use-debounce'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

const PER_PAGE = 10
type SortKey = 'namaLengkap' | 'nik' | 'posisi' | 'cabang' | 'traineeSelesai' | ''

export default function DataKaryawanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, aktif: 0, nonAktif: 0, segera: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Get from URL params, default to empty string
  const search = searchParams.get('search') ?? ''
  const cabang = searchParams.get('cabang') ?? ''
  const statusFilter = searchParams.get('status') ?? ''
  const contractFilter = searchParams.get('filter') ?? '' // expiring14 | expiring30 | expiring90 | expired
  const posisiFilter = searchParams.get('posisi') ?? ''
  const departmentFilter = searchParams.get('dept') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  const [sortCol, setSortCol] = useState<SortKey>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showFilter, setShowFilter] = useState(false)
  const [cabangOptions, setCabangOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<{ id: string; name: string }[]>([])

  // Helper to update URL params
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    // Always reset to page 1 when filter changes
    if (updates.search !== undefined || updates.cabang !== undefined || updates.status !== undefined || updates.filter !== undefined || updates.dept !== undefined) {
      params.set('page', '1')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const { role } = useSidebar()
  const isAdmin = role === 'ADMIN'

  // Debounce search 300ms to avoid query spam on every keystroke
  const debouncedSearch = useDebounce(search, 300)

  const fetchData = async () => {
    setLoading(true)
    const [result, statsResult] = await Promise.all([
      getEmployees({ search: debouncedSearch, cabang, status: statusFilter, contractFilter, posisi: posisiFilter, departmentId: departmentFilter, page, perPage: PER_PAGE }),
      getEmployeeStats({ search: debouncedSearch, cabang }),
    ])
    setEmployees(result.employees)
    setTotal(result.total)
    setStats(statsResult)
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [debouncedSearch, cabang, statusFilter, contractFilter, posisiFilter, departmentFilter, page])

  // Load cabang options once on mount (from all data, not just current page)
  useEffect(() => { getDistinctCabang().then(setCabangOptions) }, [])
  useEffect(() => { getDepartments().then(depts => setDepartmentOptions(depts.map(d => ({ id: d.id, name: d.name })))) }, [])



  const now = new Date()

  // Sort is applied client-side on the current page (server handles filtering + pagination)
  const sortedEmployees = useMemo(() => {
    if (!sortCol) return employees
    return [...employees].sort((a, b) => {
      let va: string, vb: string
      if (sortCol === 'posisi') { va = a.contracts?.[0]?.posisi ?? ''; vb = b.contracts?.[0]?.posisi ?? '' }
      else if (sortCol === 'traineeSelesai') {
        va = a.contracts?.[0]?.traineeSelesai ? String(a.contracts[0].traineeSelesai) : ''
        vb = b.contracts?.[0]?.traineeSelesai ? String(b.contracts[0].traineeSelesai) : ''
      }
      else { va = String((a as Record<string, unknown>)[sortCol] ?? ''); vb = String((b as Record<string, unknown>)[sortCol] ?? '') }
      va = va.toLowerCase(); vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [employees, sortCol, sortDir])

  const totalPages = Math.ceil(total / PER_PAGE)
  const rows = sortedEmployees

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

  const handleSort = (col: SortKey) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) { toast.error('Anda tidak memiliki izin menghapus — hubungi Admin'); return }
    setIsDeleting(id)

    // Optimistic: remove from UI immediately
    const deletedEmployee = employees.find(e => e.id === id)
    setEmployees(prev => prev.filter(e => e.id !== id))

    try {
      const r = await deleteEmployee(id)
      if (r.success) {
        toast.success(`Data ${name} berhasil dihapus`)
      } else {
        // Restore on error
        if (deletedEmployee) {
          setEmployees(prev => [...prev, deletedEmployee])
        }
        toast.error(r.error)
      }
    } catch (err) {
      // Restore on network error
      if (deletedEmployee) {
        setEmployees(prev => [...prev, deletedEmployee])
      }
      toast.error('Koneksi terputus — data dikembalikan, coba ulangi')
    } finally {
      setIsDeleting(null)
    }
  }

  const fmtDate = (s: string | Date) =>
    !s ? '-' : format(new Date(s), 'dd MMM yyyy', { locale: localeID })

  const getStatusChip = (emp: EmployeeRow) => {
    if (emp.status !== 'AKTIF') {
      return <button onClick={() => updateParams({ status: 'NON-AKTIF' })} className="chip-nonaktif hover:opacity-80 transition-opacity cursor-pointer">Non-Aktif</button>
    }
    const c = emp.contracts?.[0]
    if (c) {
      const d = differenceInDays(new Date(c.traineeSelesai), now)
      if (d < 0) return <button onClick={() => updateParams({ filter: 'expired' })} className="chip-expired hover:opacity-80 transition-opacity cursor-pointer">Expired</button>
      if (d <= 30) return <button onClick={() => updateParams({ filter: 'expiring30' })} className="chip-warning hover:opacity-80 transition-opacity cursor-pointer">Segera Habis</button>
    }
    return <button onClick={() => updateParams({ status: 'AKTIF' })} className="chip-aktif hover:opacity-80 transition-opacity cursor-pointer">Aktif</button>
  }

  const getDaysBadge = (emp: EmployeeRow) => {
    const c = emp.contracts?.[0]
    if (!c) return null
    const d = differenceInDays(new Date(c.traineeSelesai), now)
    if (d < 0) {
      return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle size={12} /> Expired</span>
    }
    if (d <= 14) {
      return <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><Warning size={12} /> {d}h</span>
    }
    if (d <= 30) {
      return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Clock size={12} /> {d}h</span>
    }
    if (d <= 90) {
      return <span className="text-xs font-medium text-muted-foreground">{d}h</span>
    }
    return <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> {d}h</span>
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortCol !== col) return <ArrowsDownUp size={12} className="ml-1 text-muted-foreground/50 inline-block" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="ml-1 text-primary inline-block" />
      : <ArrowDown size={12} className="ml-1 text-primary inline-block" />
  }

  return (
    <div className="space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Karyawan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen data trainee Astra Motor Kalimantan Barat
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && <ExportExcelButton variant="default" />}
          {isAdmin && <ImportExcelButton />}
          {isAdmin && (
            <Link href="/karyawan/tambah">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={16} />
                Tambah Karyawan
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ─── Viewer Notice ─── */}
      {!isAdmin && (
        <div className="flex items-center gap-2 px-4 py-4 rounded-md bg-muted/50 border border-border text-sm text-foreground/70">
          <Eye size={16} className="text-muted-foreground/70 shrink-0" />
          <span>Mode <strong>Pemirsa</strong> — Anda hanya dapat melihat data. Hubungi Admin untuk perubahan.</span>
        </div>
      )}

      {/* ─── Active Contract Filter Banner ─── */}
      {contractFilter && (
        <div className={cn(
          'flex items-center justify-between gap-4 rounded-md border px-4 py-4',
          contractFilter === 'expired'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
            : contractFilter === 'expiring14'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
              : contractFilter === 'expiring30'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50'
        )}>
          <div className="flex items-center gap-2 min-w-0">
            <Warning size={16} className={cn(
              'shrink-0',
              contractFilter === 'expired' || contractFilter === 'expiring14' ? 'text-red-600' :
              contractFilter === 'expiring30' ? 'text-amber-600' : 'text-primary'
            )} />
            <p className="text-sm font-semibold truncate">
              {contractFilter === 'expired' && 'Menampilkan kontrak yang sudah expired'}
              {contractFilter === 'expiring14' && 'Menampilkan kontrak yang berakhir dalam 14 hari (kritis)'}
              {contractFilter === 'expiring30' && 'Menampilkan kontrak yang berakhir dalam 30 hari'}
              {contractFilter === 'expiring90' && 'Menampilkan kontrak yang perlu tindakan (≤ 90 hari)'}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">({total} karyawan)</span>
            </p>
          </div>
          <button
            onClick={() => updateParams({ filter: '' })}
            className="shrink-0 text-xs font-semibold text-foreground/70 hover:text-foreground px-2 py-1 rounded border border-border bg-card hover:bg-muted/50 transition-colors flex items-center gap-2"
          >
            <XCircle size={12} />
            Hapus Filter
          </button>
        </div>
      )}

      {/* ─── Posisi Filter Banner ─── */}
      {posisiFilter && (
        <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-4 bg-accent border-primary/20">
          <p className="text-sm font-semibold text-primary truncate">
            Posisi: <span className="font-bold">{posisiFilter}</span>
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">({total} karyawan)</span>
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

      {/* ─── Stat Cards — contract-derived ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<User size={20} className="text-white" />}
          iconBg="bg-primary"
          value={stats.total}
          label="Total Karyawan"
          primary
          href="/karyawan"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-600" />}
          iconBg="bg-green-50"
          value={stats.aktif}
          label="Kontrak Aktif"
          href="/karyawan?status=AKTIF"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-500" />}
          iconBg="bg-amber-50"
          value={stats.segera}
          label="Segera Habis ≤ 30h"
          highlight={stats.segera > 0}
          href="/karyawan?filter=expiring30"
        />
        <StatCard
          icon={<XCircle size={20} className="text-rose-500" />}
          iconBg="bg-rose-50"
          value={stats.expired}
          label="Kontrak Expired"
          highlight={stats.expired > 0}
          href="/karyawan?filter=expired"
        />
      </div>

      {/* ─── MagnifyingGlass + Funnel Toolbar ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* MagnifyingGlass */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              placeholder="Cari nama, NIK, atau posisi..."
              aria-label="Cari karyawan"
              className="w-full h-8 pl-8 pr-4 text-base sm:text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
            />
            {search && (
              <button onClick={() => updateParams({ search: '' })} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70">
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
                {sortCol && <span className="ml-1 text-xs">({sortCol === 'namaLengkap' ? 'Nama' : sortCol === 'traineeSelesai' ? 'Tgl Selesai' : sortCol})</span>}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {[
                { key: 'namaLengkap', label: 'Nama Lengkap' },
                { key: 'nik', label: 'NIK' },
                { key: 'posisi', label: 'Posisi' },
                { key: 'cabang', label: 'Cabang' },
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
            {(cabang || statusFilter || departmentFilter) && (
              <span className="h-2 w-2 rounded-full bg-primary ml-0.5" />
            )}
          </button>
        </div>

        {/* Funnel Panel */}
        {showFilter && (
          <div className="flex flex-wrap gap-6 px-4 py-4 rounded-md bg-muted/50 border border-border items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Cabang</label>
              <select
                value={cabang}
                onChange={(e) => updateParams({ cabang: e.target.value })}
                aria-label="Filter cabang"
                className="h-8 px-2 pr-7 text-sm border border-border rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => updateParams({ status: e.target.value })}
                aria-label="Filter status"
                className="h-8 px-2 pr-7 text-sm border border-border rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="NON-AKTIF">Non-Aktif</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Departemen</label>
              <select
                value={departmentFilter}
                onChange={(e) => updateParams({ dept: e.target.value })}
                aria-label="Filter departemen"
                className="h-8 px-2 pr-7 text-sm border border-border rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Departemen</option>
                {departmentOptions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            {(cabang || statusFilter || departmentFilter) && (
              <button
                onClick={() => updateParams({ cabang: '', status: '', dept: '' })}
                className="h-8 px-4 text-xs font-semibold text-muted-foreground hover:text-red-600 border border-border rounded-md bg-card hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Table (Desktop) ─── */}
      <div className="hidden md:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-border bg-accent/60">

                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('namaLengkap')}
                >
                  Nama Karyawan <SortIcon col="namaLengkap" />
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('nik')}
                >
                  NIK <SortIcon col="nik" />
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('posisi')}
                >
                  Posisi <SortIcon col="posisi" />
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('cabang')}
                >
                  Cabang <SortIcon col="cabang" />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Departemen
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Trainee Sejak
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('traineeSelesai')}
                >
                  Selesai <SortIcon col="traineeSelesai" />
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Sisa
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-10 px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: PER_PAGE }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/50">

                    <td className="px-4 py-2">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-4" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <EmptyState
                  asTableRow
                  colSpan={11}
                  icon={search || cabang || statusFilter || contractFilter ? MagnifyingGlass : User}
                  title={search || cabang || statusFilter || contractFilter ? 'Tidak ada data ditemukan' : 'Belum ada karyawan'}
                  description={
                    search || cabang || statusFilter || contractFilter
                      ? 'Coba ubah filter atau kata kunci pencarian'
                      : 'Tambahkan karyawan pertama atau import dari Excel'
                  }
                  action={
                    !search && !cabang && !statusFilter && !contractFilter && isAdmin
                      ? { label: 'Tambah Karyawan', href: '/karyawan/tambah' }
                      : undefined
                  }
                />
              ) : (
                rows.map((emp) => {
                  const c = emp.contracts?.[0]
                  const daysLeft = c ? differenceInDays(new Date(c.traineeSelesai), now) : null
                  const isKritis = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0
                  const isMendekat = daysLeft !== null && daysLeft > 14 && daysLeft <= 30

                  return (
                    <tr
                      key={emp.id}
                      className={cn(
                        'hover:bg-muted/50 transition-colors group',
                        isKritis && 'bg-red-50/40',
                        isMendekat && !isKritis && 'bg-amber-50/30',
                      )}
                    >

                      {/* Nama */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-4">
                          {emp.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={emp.image} alt={`Foto ${emp.namaLengkap}`} className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                              <User size={16} className="text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {emp.namaLengkap}
                            </p>
                            <p className="text-xs text-muted-foreground">{emp.noHp || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* NIK */}
                      <td className="px-4 py-2">
                        <Link
                          href={`/karyawan/${emp.id}`}
                          className="text-sm font-mono text-primary hover:underline font-medium"
                        >
                          {emp.nik || '—'}
                        </Link>
                      </td>
                      {/* Posisi */}
                      <td className="px-4 py-2 text-sm text-foreground/80">
                        {c?.posisi || '—'}
                      </td>
                      {/* Cabang */}
                      <td className="px-4 py-2 text-sm text-foreground/80">{emp.cabang}</td>
                      {/* Departemen */}
                      <td className="px-4 py-2 text-sm text-foreground/80">
                        {emp.department ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-xs font-medium text-foreground/80">
                            {emp.department.name}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">—</span>
                        )}
                      </td>
                      {/* Sejak */}
                      <td className="px-4 py-2 text-sm text-foreground/70">{c ? fmtDate(c.traineeSejak) : '—'}</td>
                      {/* Selesai */}
                      <td className={cn(
                        'px-4 py-2 text-sm font-medium',
                        isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-foreground/80'
                      )}>
                        {c ? fmtDate(c.traineeSelesai) : '—'}
                      </td>
                      {/* Sisa hari */}
                      <td className="px-4 py-2 text-center">
                        {getDaysBadge(emp)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-2 text-center">
                        {getStatusChip(emp)}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-1.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={`/karyawan/${emp.id}`}
                                aria-label="Lihat detail karyawan"
                                className="h-8 w-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-400"
                              >
                                <Eye size={16} />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Lihat detail</TooltipContent>
                          </Tooltip>

                          {isAdmin && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={`/karyawan/${emp.id}/edit`}
                                    aria-label="Edit data karyawan"
                                    className="h-8 w-8 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-400"
                                  >
                                    <Pencil size={16} />
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>Edit data</TooltipContent>
                              </Tooltip>

                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger
                                      aria-label="Hapus karyawan"
                                      disabled={isDeleting === emp.id}
                                      className="h-8 w-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:outline-none dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-400"
                                    >
                                      {isDeleting === emp.id
                                        ? <CircleNotch size={16} className="animate-spin" />
                                        : <Trash size={16} />}
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>Hapus data</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus data karyawan?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Data <strong>{emp.namaLengkap}</strong> beserta seluruh riwayat kontrak akan dihapus permanen dan tidak dapat dipulihkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(emp.id, emp.namaLengkap)}
                                      className="bg-rose-600 hover:bg-rose-700"
                                      disabled={isDeleting === emp.id}
                                    >
                                      Ya, Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 0 && !loading && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              {total === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)}`} dari{' '}
              <span className="font-semibold text-foreground/80">{total}</span> karyawan
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
            icon={search || cabang || statusFilter || contractFilter ? MagnifyingGlass : User}
            title={search || cabang || statusFilter || contractFilter ? 'Tidak ada data ditemukan' : 'Belum ada karyawan'}
            description={
              search || cabang || statusFilter || contractFilter
                ? 'Coba ubah filter atau kata kunci'
                : 'Tambahkan karyawan pertama atau import dari Excel'
            }
            action={
              !search && !cabang && !statusFilter && !contractFilter && isAdmin
                ? { label: 'Tambah Karyawan', href: '/karyawan/tambah' }
                : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((emp) => {
              const c = emp.contracts?.[0]
              const daysLeft = c ? differenceInDays(new Date(c.traineeSelesai), now) : null
              const isKritis = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0

              return (
                <div
                  key={emp.id}
                  className={cn(
                    'px-4 py-4 flex items-start gap-4',
                    isKritis && 'bg-red-50/40'
                  )}
                >
                  {/* Avatar */}
                  {emp.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={emp.image} alt={`Foto ${emp.namaLengkap}`} className="h-10 w-10 rounded-full object-cover shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                      <User size={16} className="text-primary" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{emp.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c?.posisi || '—'} · {emp.cabang}
                          {emp.department && (
                            <> · <span className="text-primary/70">{emp.department.name}</span></>
                          )}
                        </p>
                      </div>
                      {getStatusChip(emp)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {emp.nik && (
                        <span className="text-xs font-mono text-primary bg-accent px-2 py-0.5 rounded">
                          {emp.nik}
                        </span>
                      )}
                      {c && (
                        <span className="text-xs text-muted-foreground">
                          Selesai: <span className={cn('font-medium', isKritis ? 'text-red-600' : 'text-foreground/80')}>
                            {fmtDate(c.traineeSelesai)}
                          </span>
                        </span>
                      )}
                      {getDaysBadge(emp)}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-2 mt-1 shrink-0">
                    <Link
                      href={`/karyawan/${emp.id}`}
                      aria-label="Lihat detail"
                      className="h-11 w-11 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-400"
                    >
                      <Eye size={16} />
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href={`/karyawan/${emp.id}/edit`}
                          aria-label="Edit data"
                          className="h-11 w-11 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors dark:bg-amber-950 dark:hover:bg-amber-900 dark:text-amber-400"
                        >
                          <Pencil size={16} />
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger
                            aria-label="Hapus"
                            disabled={isDeleting === emp.id}
                            className="h-11 w-11 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors disabled:opacity-50 dark:bg-rose-950 dark:hover:bg-rose-900 dark:text-rose-400"
                          >
                            {isDeleting === emp.id
                              ? <CircleNotch size={16} className="animate-spin" />
                              : <Trash size={16} />}
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus data karyawan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Data <strong>{emp.namaLengkap}</strong> akan dihapus permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(emp.id, emp.namaLengkap)}
                                className="bg-rose-600 hover:bg-rose-700"
                              >
                                Ya, Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Hal. {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <PgBtn onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })} disabled={page <= 1}>
                <CaretLeft size={16} />
              </PgBtn>
              <PgBtn onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })} disabled={page >= totalPages}>
                <CaretRight size={16} />
              </PgBtn>
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
  icon,
  iconBg,
  value,
  label,
  primary = false,
  highlight = false,
  href,
}: {
  icon: React.ReactNode
  iconBg: string
  value: number
  label: string
  primary?: boolean
  highlight?: boolean
  href?: string
}) {
  const inner = (
    <>
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div>
        <p className={cn('text-2xl font-bold leading-snug', primary ? 'text-white' : 'text-foreground')}>
          {value.toLocaleString('id-ID')}
        </p>
        <p className={cn('text-xs mt-1', primary ? 'text-blue-100' : 'text-muted-foreground')}>
          {label}
        </p>
      </div>
    </>
  )
  const cls = cn(
    'rounded-lg p-4 flex items-center gap-4 shadow-sm',
    href && 'hover:shadow-md transition-shadow cursor-pointer',
    primary ? 'bg-primary' : highlight ? 'bg-card border border-amber-200' : 'bg-card border border-border'
  )
  if (href) return <Link href={href} className={cls}>{inner}</Link>
  return <div className={cls}>{inner}</div>
}

function PgBtn({
  children,
  active,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-7 min-w-7 px-2 flex items-center justify-center rounded-md text-xs font-medium border transition-colors',
        active
          ? 'bg-primary text-white border-primary'
          : disabled
            ? 'text-muted-foreground/50 border-border bg-card cursor-not-allowed'
            : 'text-foreground/70 border-border bg-card hover:bg-muted/50 cursor-pointer'
      )}
    >
      {children}
    </button>
  )
}
