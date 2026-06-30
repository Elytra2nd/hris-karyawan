'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getEmployees, getEmployeeStats, deleteEmployee, getDistinctCabang } from '@/app/actions/employee'
import type { Prisma } from '@prisma/client'

type EmployeeRow = Prisma.EmployeeGetPayload<{
  include: { contracts: true }
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
import { hasPermission } from '@/lib/permissions'
import { NativeSelect } from '@/components/ui/native-select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { ExportExcelButton } from '@/components/export-excel-button'
import { ImportExcelButton } from '@/components/import-excel-button'
import { useDebounce } from '@/hooks/use-debounce'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

const PER_PAGE = 10
type SortKey = 'namaLengkap' | 'nik' | 'posisi' | 'cabang' | 'traineeSelesai' | ''

// Dideklarasikan di module-level (bukan dalam render) agar tidak reset tiap render
function SortIcon({ col, sortCol, sortDir }: { col: SortKey; sortCol: SortKey; sortDir: 'asc' | 'desc' }) {
  if (sortCol !== col) return <ArrowsDownUp size={12} className="ml-1 text-muted-foreground/50 inline-block" />
  return sortDir === 'asc'
    ? <ArrowUp size={12} className="ml-1 text-primary inline-block" />
    : <ArrowDown size={12} className="ml-1 text-primary inline-block" />
}

export default function DataKaryawanPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({ total: 0, aktif: 0, nonAktif: 0, segera: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  // Konfirmasi hapus dari kebab mobile (AlertDialog terkontrol)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)

  // Get from URL params, default to empty string
  const urlSearch = searchParams.get('search') ?? ''
  const cabang = searchParams.get('cabang') ?? ''
  const statusFilter = searchParams.get('status') ?? ''
  const contractFilter = searchParams.get('filter') ?? '' // expiring14 | expiring30 | expiring90 | expired
  const posisiFilter = searchParams.get('posisi') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  const [sortCol, setSortCol] = useState<SortKey>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showFilter, setShowFilter] = useState(false)
  const [cabangOptions, setCabangOptions] = useState<string[]>([])

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
    if (updates.search !== undefined || updates.cabang !== undefined || updates.status !== undefined || updates.filter !== undefined || updates.posisi !== undefined) {
      params.set('page', '1')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const { role } = useSidebar()
  // Gating berbasis permission, bukan hardcode ADMIN — HR_MANAGER & HR_STAFF
  // juga berhak sesuai matrix (lihat src/lib/permissions.ts).
  const canCreate = hasPermission(role, 'employee_create')   // ADMIN, HR_MANAGER, HR_STAFF
  const canEdit   = hasPermission(role, 'employee_update')   // ADMIN, HR_MANAGER, HR_STAFF
  const canExport = hasPermission(role, 'export_data')       // ADMIN, HR_MANAGER
  const canImport = hasPermission(role, 'import_data')       // ADMIN, HR_MANAGER
  const canDelete = hasPermission(role, 'employee_delete')   // ADMIN, HR_MANAGER
  const isReadOnly = !canCreate && !canEdit && !canExport && !canImport

  // Input search pakai state lokal (responsif instan), lalu di-debounce.
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

  // Penanda untuk memaksa refetch (mis. setelah delete) tanpa mengubah filter
  const [refreshTick, setRefreshTick] = useState(0)

  // Fetch data. Flag `ignore` mencegah respons lama (out-of-order) menimpa yang baru.
  useEffect(() => {
    let ignore = false
    const run = async () => {
      setLoading(true)
      const [result, statsResult] = await Promise.all([
        getEmployees({ search: debouncedSearch, cabang, status: statusFilter, contractFilter, posisi: posisiFilter, page, perPage: PER_PAGE, sortBy: sortCol, sortDir }),
        getEmployeeStats({ search: debouncedSearch, cabang, posisi: posisiFilter }),
      ])
      if (ignore) return
      setEmployees(result.employees)
      setTotal(result.total)
      setStats(statsResult)
      setLoading(false)
    }
    run()
    return () => { ignore = true }
  }, [debouncedSearch, cabang, statusFilter, contractFilter, posisiFilter, page, sortCol, sortDir, refreshTick])

  // Load opsi filter sekali saat mount (dari seluruh data, bukan halaman aktif)
  useEffect(() => { getDistinctCabang().then(setCabangOptions).catch(() => setCabangOptions([])) }, [])



  const now = new Date()

  const totalPages = Math.ceil(total / PER_PAGE)
  // Sort dilakukan di server (lintas seluruh dataset, bukan hanya halaman aktif)
  const rows = employees

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
    if (!canDelete) { toast.error('Anda tidak memiliki izin menghapus - hubungi Admin'); return }
    setIsDeleting(id)

    // Optimistic: hapus dari UI seketika
    setEmployees(prev => prev.filter(e => e.id !== id))

    try {
      const r = await deleteEmployee(id)
      if (r.success) {
        toast.success(`Data ${name} berhasil dihapus`)
      } else {
        toast.error(r.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setIsDeleting(null)
      // Selalu refetch: sukses -> sinkron total/stats/pagination; gagal -> kembalikan
      // baris ke posisi sortir yang benar (bukan ditempel di bawah).
      setRefreshTick(t => t + 1)
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

  return (
    <div className="space-y-6 pb-24 sm:pb-6">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Trainee</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen data trainee Astra Motor Kalimantan Barat
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && <ExportExcelButton variant="default" />}
          {canImport && <ImportExcelButton />}
          {/* Desktop: tombol inline. Mobile: dipindah ke FAB kanan-bawah (lihat bawah). */}
          {canCreate && (
            <Link href="/karyawan/tambah" className="hidden sm:block">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={16} />
                Tambah Trainee
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ─── Viewer Notice ─── */}
      {isReadOnly && (
        <div className="flex items-center gap-2 px-4 py-4 rounded-md bg-muted/50 border border-border text-sm text-foreground/70">
          <Eye size={16} className="text-muted-foreground/70 shrink-0" />
          <span>Mode <strong>Pemirsa</strong> - Anda hanya dapat melihat data. Hubungi Admin untuk perubahan.</span>
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
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">({total} trainee)</span>
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
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">({total} trainee)</span>
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
          icon={<User size={20} className="text-primary" />}
          iconBg="bg-accent"
          value={stats.total}
          label="Total Trainee"
          href="/karyawan"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-green-600" />}
          iconBg="bg-green-50 dark:bg-green-950"
          value={stats.aktif}
          label="Kontrak Aktif"
          href="/karyawan?status=AKTIF"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-500" />}
          iconBg="bg-amber-50 dark:bg-amber-950"
          value={stats.segera}
          label="Segera Habis ≤30 hari"
          highlight={stats.segera > 0}
          accent="amber"
          href="/karyawan?filter=expiring30"
        />
        <StatCard
          icon={<XCircle size={20} className="text-rose-500" />}
          iconBg="bg-rose-50 dark:bg-rose-950"
          value={stats.expired}
          label="Kontrak Expired"
          highlight={stats.expired > 0}
          accent="rose"
          href="/karyawan?filter=expired"
        />
      </div>

      {/* ─── Search + Funnel Toolbar (sticky di atas saat scroll) ─── */}
      <div className="sticky top-12 z-20 py-2 bg-background/95 backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama, NIK, atau posisi..."
              aria-label="Cari trainee"
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
              <button aria-label="Urutkan" className={cn(
                'flex items-center gap-2 h-8 px-3 sm:px-4 text-sm border rounded-md transition-colors shrink-0',
                sortCol
                  ? 'border-primary text-primary bg-accent font-semibold'
                  : 'border-border text-foreground/70 bg-card hover:bg-muted/50'
              )}>
                <ArrowsDownUp size={16} />
                <span className="hidden sm:inline">Urutkan</span>
                {sortCol && <span className="ml-1 text-xs hidden sm:inline">({sortCol === 'namaLengkap' ? 'Nama' : sortCol === 'traineeSelesai' ? 'Tgl Selesai' : sortCol})</span>}
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
            aria-label="Filter"
            className={cn(
              'flex items-center gap-2 h-8 px-3 sm:px-4 text-sm border rounded-md transition-colors shrink-0',
              (showFilter || cabang || statusFilter)
                ? 'border-primary text-primary bg-accent font-semibold'
                : 'border-border text-foreground/70 bg-card hover:bg-muted/50'
            )}
          >
            <Sliders size={16} />
            <span className="hidden sm:inline">Funnel</span>
            {(cabang || statusFilter || contractFilter) && (
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
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Status Trainee</label>
              <NativeSelect
                value={statusFilter}
                onChange={(e) => updateParams({ status: e.target.value })}
                aria-label="Filter status trainee"
              >
                <option value="">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="NON-AKTIF">Non-Aktif</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Status Kontrak</label>
              <NativeSelect
                value={contractFilter}
                onChange={(e) => updateParams({ filter: e.target.value })}
                aria-label="Filter status kontrak"
              >
                <option value="">Semua Kontrak</option>
                <option value="safe">Aman (&gt; 90 hari)</option>
                <option value="expiring90">Perlu Tindakan (≤ 90 hari)</option>
                <option value="expiring30">Segera Habis (≤ 30 hari)</option>
                <option value="expiring14">Kritis (≤ 14 hari)</option>
                <option value="expired">Sudah Expired</option>
              </NativeSelect>
            </div>
            {(cabang || statusFilter || contractFilter) && (
              <button
                onClick={() => updateParams({ cabang: '', status: '', filter: '' })}
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
          <table className="w-full min-w-[1120px]">
            <thead>
              <tr className="border-b border-border bg-accent/60">

                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('namaLengkap')}
                >
                  Nama Trainee <SortIcon col="namaLengkap" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('nik')}
                >
                  NIK <SortIcon col="nik" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  L/P
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('posisi')}
                >
                  Posisi <SortIcon col="posisi" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('cabang')}
                >
                  Cabang <SortIcon col="cabang" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Trainee Sejak
                </th>
                <th
                  className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('traineeSelesai')}
                >
                  Selesai <SortIcon col="traineeSelesai" sortCol={sortCol} sortDir={sortDir} />
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  No. Perjanjian
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
                    <td className="px-4 py-2"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-2"><Skeleton className="h-4 w-24" /></td>
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
                  icon={searchInput || cabang || statusFilter || contractFilter ? MagnifyingGlass : User}
                  title={searchInput || cabang || statusFilter || contractFilter ? 'Tidak ada data ditemukan' : 'Belum ada karyawan'}
                  description={
                    searchInput || cabang || statusFilter || contractFilter
                      ? 'Coba ubah filter atau kata kunci pencarian'
                      : 'Tambahkan trainee pertama atau import dari Excel'
                  }
                  action={
                    !searchInput && !cabang && !statusFilter && !contractFilter && canCreate
                      ? { label: 'Tambah Trainee', href: '/karyawan/tambah' }
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
                            <p className="text-xs text-muted-foreground">{emp.noHp || '-'}</p>
                          </div>
                        </div>
                      </td>
                      {/* NIK */}
                      <td className="px-4 py-2">
                        <Link
                          href={`/karyawan/${emp.id}`}
                          className="text-sm font-mono text-primary hover:underline font-medium"
                        >
                          {emp.nik || '-'}
                        </Link>
                      </td>
                      {/* Gender */}
                      <td className="px-4 py-2 text-center text-sm text-foreground/80">
                        {emp.gender || '-'}
                      </td>
                      {/* Posisi */}
                      <td className="px-4 py-2 text-sm text-foreground/80">
                        {c?.posisi || '-'}
                      </td>
                      {/* Cabang */}
                      <td className="px-4 py-2 text-sm text-foreground/80">{emp.cabang}</td>
                      {/* Sejak */}
                      <td className="px-4 py-2 text-sm text-foreground/70">{c ? fmtDate(c.traineeSejak) : '-'}</td>
                      {/* Selesai */}
                      <td className={cn(
                        'px-4 py-2 text-sm font-medium',
                        isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-foreground/80'
                      )}>
                        {c ? fmtDate(c.traineeSelesai) : '-'}
                      </td>
                      {/* No. Perjanjian */}
                      <td className="px-4 py-2 text-sm font-mono text-foreground/70">
                        {c?.contractNumber || '-'}
                      </td>
                      {/* Sisa hari */}
                      <td className="px-4 py-2 text-center">
                        {getDaysBadge(emp)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-2 text-center">
                        {getStatusChip(emp)}
                      </td>
                      {/* Action — dibungkus kebab menu */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label={`Aksi untuk ${emp.namaLengkap}`}
                                disabled={isDeleting === emp.id}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:outline-none"
                              >
                                {isDeleting === emp.id
                                  ? <CircleNotch size={18} className="animate-spin" />
                                  : <DotsThreeVertical size={18} weight="bold" />}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/karyawan/${emp.id}`}><Eye size={14} className="mr-2" /> Lihat Detail</Link>
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem asChild className="cursor-pointer">
                                  <Link href={`/karyawan/${emp.id}/edit`}><Pencil size={14} className="mr-2" /> Edit Data</Link>
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={(e) => { e.preventDefault(); setConfirmDelete({ id: emp.id, name: emp.namaLengkap }) }}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <Trash size={14} className="mr-2" /> Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
              {total === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, total)}`} dari{' '}
              <span className="font-semibold text-foreground/80">{total}</span> trainee
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
            icon={searchInput || cabang || statusFilter || contractFilter ? MagnifyingGlass : User}
            title={searchInput || cabang || statusFilter || contractFilter ? 'Tidak ada data ditemukan' : 'Belum ada karyawan'}
            description={
              searchInput || cabang || statusFilter || contractFilter
                ? 'Coba ubah filter atau kata kunci'
                : 'Tambahkan trainee pertama atau import dari Excel'
            }
            action={
              !searchInput && !cabang && !statusFilter && !contractFilter && canCreate
                ? { label: 'Tambah Trainee', href: '/karyawan/tambah' }
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
                    'px-4 py-4 flex flex-col gap-3',
                    isKritis && 'bg-red-50/40'
                  )}
                >
                  <div className="flex items-start gap-3">
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
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">{emp.namaLengkap}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {c?.posisi || '—'} · {emp.cabang}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          {getStatusChip(emp)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                aria-label="Aksi trainee"
                                className="h-8 w-8 -mr-1.5 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 transition-colors"
                              >
                                <DotsThreeVertical size={18} weight="bold" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/karyawan/${emp.id}`}><Eye size={14} className="mr-2" /> Lihat Detail</Link>
                              </DropdownMenuItem>
                              {canEdit && (
                                <DropdownMenuItem asChild className="cursor-pointer">
                                  <Link href={`/karyawan/${emp.id}/edit`}><Pencil size={14} className="mr-2" /> Edit Data</Link>
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onSelect={(e) => { e.preventDefault(); setConfirmDelete({ id: emp.id, name: emp.namaLengkap }) }}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <Trash size={14} className="mr-2" /> Hapus
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {emp.nik && (
                          <span className="text-xs font-mono text-primary bg-accent px-2 py-0.5 rounded">
                            {emp.nik}
                          </span>
                        )}
                        {emp.gender && (
                          <span className="text-xs text-muted-foreground">
                            {emp.gender === 'L' ? 'Laki-laki' : emp.gender === 'P' ? 'Perempuan' : emp.gender}
                          </span>
                        )}
                        {c && (
                          <span className="text-xs text-muted-foreground">
                            Selesai: <span className={cn('font-medium', isKritis ? 'text-red-600' : 'text-foreground/80')}>
                              {fmtDate(c.traineeSelesai)}
                            </span>
                          </span>
                        )}
                        {c?.contractNumber && (
                          <span className="text-xs font-mono text-muted-foreground/80">
                            No. {c.contractNumber}
                          </span>
                        )}
                        {getDaysBadge(emp)}
                      </div>
                    </div>
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

      {/* ─── Konfirmasi hapus (dipakai aksi tabel desktop & kebab mobile) ─── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data trainee?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{confirmDelete?.name}</strong> beserta seluruh riwayat kontrak akan dihapus permanen dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirmDelete) handleDelete(confirmDelete.id, confirmDelete.name); setConfirmDelete(null) }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── FAB Tambah Trainee (mobile only) ─── */}
      {canCreate && (
        <Link
          href="/karyawan/tambah"
          aria-label="Tambah Trainee"
          className="sm:hidden fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus size={26} weight="bold" />
        </Link>
      )}

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
  highlight = false,
  accent = 'amber',
  href,
}: {
  icon: React.ReactNode
  iconBg: string
  value: number
  label: string
  highlight?: boolean
  accent?: 'amber' | 'rose'
  href?: string
}) {
  const inner = (
    <>
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-snug text-foreground tabular-nums">
          {value.toLocaleString('id-ID')}
        </p>
        <p className="text-xs mt-1 text-muted-foreground">{label}</p>
      </div>
    </>
  )
  // Semua kartu seragam: card putih + border. Saat highlight, border berwarna
  // sesuai severity (amber=segera, rose=expired) — bukan satu warna untuk semua.
  const cls = cn(
    'rounded-lg p-4 flex items-center gap-4 shadow-sm bg-card border',
    href && 'hover:shadow-md transition-shadow cursor-pointer',
    highlight
      ? accent === 'rose'
        ? 'border-rose-200 dark:border-rose-900/50'
        : 'border-amber-200 dark:border-amber-900/50'
      : 'border-border'
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
