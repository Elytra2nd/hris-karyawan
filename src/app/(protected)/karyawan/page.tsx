'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getEmployees, deleteEmployee } from '@/app/actions/employee'
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
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Get from URL params, default to empty string
  const search = searchParams.get('search') ?? ''
  const cabang = searchParams.get('cabang') ?? ''
  const statusFilter = searchParams.get('status') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

  const [sortCol, setSortCol] = useState<SortKey>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showFilter, setShowFilter] = useState(false)

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
    if (updates.search !== undefined || updates.cabang !== undefined || updates.status !== undefined) {
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
    const data = await getEmployees({ search: debouncedSearch, cabang, status: statusFilter })
    setEmployees(data)
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [debouncedSearch, cabang, statusFilter])

  const cabangOptions = useMemo(
    () => [...new Set(employees.map((e) => e.cabang))].sort(),
    [employees]
  )

  const now = new Date()

  const stats = useMemo(() => {
    const total = employees.length
    const aktif = employees.filter((e) => {
      const c = e.contracts?.[0]
      if (!c || e.status !== 'AKTIF') return false
      return differenceInDays(new Date(c.traineeSelesai), now) >= 0
    }).length
    const segera = employees.filter((e) => {
      const c = e.contracts?.[0]
      if (!c) return false
      const d = differenceInDays(new Date(c.traineeSelesai), now)
      return d >= 0 && d <= 30
    }).length
    return { total, aktif, nonAktif: total - aktif, segera }
  }, [employees])

  const sortedEmployees = useMemo(() => {
    if (!sortCol) return employees
    return [...employees].sort((a, b) => {
      let va: any, vb: any
      if (sortCol === 'posisi') { va = a.contracts?.[0]?.posisi || ''; vb = b.contracts?.[0]?.posisi || '' }
      else if (sortCol === 'traineeSelesai') { va = a.contracts?.[0]?.traineeSelesai || ''; vb = b.contracts?.[0]?.traineeSelesai || '' }
      else { va = a[sortCol] || ''; vb = b[sortCol] || '' }
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [employees, sortCol, sortDir])

  const totalPages = Math.ceil(sortedEmployees.length / PER_PAGE)
  const rows = sortedEmployees.slice((page - 1) * PER_PAGE, page * PER_PAGE)

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
    if (!isAdmin) { toast.error('Akses ditolak'); return }
    setIsDeleting(id)

    // Optimistic: remove from UI immediately
    const deletedEmployee = employees.find(e => e.id === id)
    setEmployees(prev => prev.filter(e => e.id !== id))

    try {
      const r = await deleteEmployee(id)
      if (r.success) {
        toast.success(`${name} berhasil dihapus`)
      } else {
        // Restore on error
        if (deletedEmployee) {
          setEmployees(prev => [...prev, deletedEmployee])
        }
        toast.error(r.error || 'Gagal menghapus')
      }
    } catch (err) {
      // Restore on network error
      if (deletedEmployee) {
        setEmployees(prev => [...prev, deletedEmployee])
      }
      toast.error('Gagal menghubungkan ke server')
    } finally {
      setIsDeleting(null)
    }
  }

  const fmtDate = (s: string) =>
    !s ? '-' : format(new Date(s), 'dd MMM yyyy', { locale: localeID })

  const getStatusChip = (emp: any) => {
    if (emp.status !== 'AKTIF') {
      return <span className="chip-nonaktif">Non-Aktif</span>
    }
    const c = emp.contracts?.[0]
    if (c) {
      const d = differenceInDays(new Date(c.traineeSelesai), now)
      if (d < 0) return <span className="chip-expired">Expired</span>
      if (d <= 30) return <span className="chip-warning">Segera Habis</span>
    }
    return <span className="chip-aktif">Aktif</span>
  }

  const getDaysBadge = (emp: any) => {
    const c = emp.contracts?.[0]
    if (!c) return null
    const d = differenceInDays(new Date(c.traineeSelesai), now)
    if (d < 0) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><XCircle size={11} /> Expired</span>
    }
    if (d <= 14) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600"><Warning size={11} /> {d}h</span>
    }
    if (d <= 30) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><Clock size={11} /> {d}h</span>
    }
    if (d <= 90) {
      return <span className="text-[11px] font-medium text-muted-foreground">{d}h</span>
    }
    return <span className="inline-flex items-center gap-1 text-[11px] text-green-600"><CheckCircle size={11} /> {d}h</span>
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortCol !== col) return <ArrowsDownUp size={13} className="ml-1 text-muted-foreground/50 inline-block" />
    return sortDir === 'asc'
      ? <ArrowUp size={13} className="ml-1 text-primary inline-block" />
      : <ArrowDown size={13} className="ml-1 text-primary inline-block" />
  }

  return (
    <div className="space-y-5">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Karyawan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen data trainee Astra Motor Kalimantan Barat
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <ExportExcelButton variant="default" />}
          {isAdmin && <ImportExcelButton />}
          {isAdmin && (
            <Link href="/karyawan/tambah">
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm">
                <Plus size={15} />
                Tambah Karyawan
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ─── Viewer Notice ─── */}
      {!isAdmin && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-md bg-muted/50 border border-border text-sm text-foreground/70">
          <Eye size={15} className="text-muted-foreground/70 shrink-0" />
          <span>Mode <strong>Pemirsa</strong> — Anda hanya dapat melihat data. Hubungi Admin untuk perubahan.</span>
        </div>
      )}

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<User size={18} className="text-white" />}
          iconBg="bg-primary"
          value={stats.total}
          label="Total Karyawan"
          primary
        />
        <StatCard
          icon={<CheckCircle size={18} className="text-green-600" />}
          iconBg="bg-green-50"
          value={stats.aktif}
          label="Karyawan Aktif"
        />
        <StatCard
          icon={<Clock size={18} className="text-amber-500" />}
          iconBg="bg-amber-50"
          value={stats.segera}
          label="Kontrak ≤ 30 hari"
          highlight={stats.segera > 0}
        />
        <StatCard
          icon={<XCircle size={18} className="text-muted-foreground/70" />}
          iconBg="bg-muted/50"
          value={stats.nonAktif}
          label="Non-Aktif"
        />
      </div>

      {/* ─── MagnifyingGlass + Funnel Toolbar ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* MagnifyingGlass */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              placeholder="Cari nama, NIK, atau posisi..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
            />
            {search && (
              <button onClick={() => updateParams({ search: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70">
                <XCircle size={14} />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-2 h-9 px-3 text-sm border rounded-md transition-colors',
                sortCol
                  ? 'border-primary text-primary bg-accent font-semibold'
                  : 'border-border text-foreground/70 bg-card hover:bg-muted/50'
              )}>
                <ArrowsDownUp size={14} />
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
              'flex items-center gap-2 h-9 px-3 text-sm border rounded-md transition-colors',
              showFilter
                ? 'border-primary text-primary bg-accent font-semibold'
                : 'border-border text-foreground/70 bg-card hover:bg-muted/50'
            )}
          >
            <Sliders size={14} />
            Funnel
            {(cabang || statusFilter) && (
              <span className="h-2 w-2 rounded-full bg-primary ml-0.5" />
            )}
          </button>
        </div>

        {/* Funnel Panel */}
        {showFilter && (
          <div className="flex flex-wrap gap-3 px-4 py-3 rounded-md bg-muted/50 border border-border">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cabang</label>
              <select
                value={cabang}
                onChange={(e) => updateParams({ cabang: e.target.value })}
                className="h-8 px-2 pr-7 text-sm border border-border rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => updateParams({ status: e.target.value })}
                className="h-8 px-2 pr-7 text-sm border border-border rounded-md bg-card text-foreground/80 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="NON-AKTIF">Non-Aktif</option>
              </select>
            </div>
            {(cabang || statusFilter) && (
              <button
                onClick={() => updateParams({ cabang: '', status: '' })}
                className="self-end h-8 px-3 text-xs font-semibold text-muted-foreground hover:text-red-600 border border-border rounded-md bg-card hover:bg-red-50 transition-colors"
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
                <th className="w-10 px-4 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('namaLengkap')}
                >
                  Nama Karyawan <SortIcon col="namaLengkap" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('nik')}
                >
                  NIK <SortIcon col="nik" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('posisi')}
                >
                  Posisi <SortIcon col="posisi" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('cabang')}
                >
                  Cabang <SortIcon col="cabang" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Trainee Sejak
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('traineeSelesai')}
                >
                  Selesai <SortIcon col="traineeSelesai" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Sisa
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                Array.from({ length: PER_PAGE }).map((_, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-4" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-12 mx-auto" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-4" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <EmptyState
                  asTableRow
                  colSpan={10}
                  icon={search || cabang || statusFilter ? MagnifyingGlass : User}
                  title={search || cabang || statusFilter ? 'Tidak ada data ditemukan' : 'Belum ada karyawan'}
                  description={
                    search || cabang || statusFilter
                      ? 'Coba ubah filter atau kata kunci pencarian'
                      : 'Tambahkan karyawan pertama atau import dari Excel'
                  }
                  action={
                    !search && !cabang && !statusFilter && isAdmin
                      ? { label: 'Tambah Karyawan', href: '/karyawan/tambah' }
                      : undefined
                  }
                />
              ) : (
                rows.map((emp: any) => {
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
                      <td className="px-4 py-3.5 text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                      </td>
                      {/* Nama */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {emp.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={emp.image} alt={`Foto ${emp.namaLengkap}`} className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                              <User size={15} className="text-primary" />
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
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/karyawan/${emp.id}`}
                          className="text-sm font-mono text-primary hover:underline font-medium"
                        >
                          {emp.nik || '—'}
                        </Link>
                      </td>
                      {/* Posisi */}
                      <td className="px-4 py-3.5 text-sm text-foreground/80">
                        {c?.posisi || '—'}
                      </td>
                      {/* Cabang */}
                      <td className="px-4 py-3.5 text-sm text-foreground/80">{emp.cabang}</td>
                      {/* Sejak */}
                      <td className="px-4 py-3.5 text-sm text-foreground/70">{c ? fmtDate(c.traineeSejak) : '—'}</td>
                      {/* Selesai */}
                      <td className={cn(
                        'px-4 py-3.5 text-sm font-medium',
                        isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-foreground/80'
                      )}>
                        {c ? fmtDate(c.traineeSelesai) : '—'}
                      </td>
                      {/* Sisa hari */}
                      <td className="px-4 py-3.5 text-center">
                        {getDaysBadge(emp)}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {getStatusChip(emp)}
                      </td>
                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md text-muted-foreground/70 hover:text-foreground/70 hover:bg-muted transition-colors">
                              <DotsThreeVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                              <Link href={`/karyawan/${emp.id}`}>
                                <Eye className="h-4 w-4 text-muted-foreground/70" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                                  <Link href={`/karyawan/${emp.id}/edit`}>
                                    <Pencil className="h-4 w-4 text-muted-foreground/70" />
                                    Edit Profil
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                                  <Link href={`/karyawan/${emp.id}/kontrak`}>
                                    <ClockCounterClockwise className="h-4 w-4 text-muted-foreground/70" />
                                    Kelola Kontrak
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <Trash className="h-4 w-4" />
                                      Hapus Data
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
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
                                        className="bg-red-600 hover:bg-red-700"
                                        disabled={isDeleting === emp.id}
                                      >
                                        {isDeleting === emp.id
                                          ? <CircleNotch size={14} className="animate-spin mr-1.5 inline" />
                                          : null}
                                        Ya, Hapus
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              {sortedEmployees.length === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, sortedEmployees.length)}`} dari{' '}
              <span className="font-semibold text-foreground/80">{sortedEmployees.length}</span> karyawan
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
              <div key={i} className="px-4 py-4 flex items-start gap-3">
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
            icon={search || cabang || statusFilter ? MagnifyingGlass : User}
            title={search || cabang || statusFilter ? 'Tidak ada data ditemukan' : 'Belum ada karyawan'}
            description={
              search || cabang || statusFilter
                ? 'Coba ubah filter atau kata kunci'
                : 'Tambahkan karyawan pertama atau import dari Excel'
            }
            action={
              !search && !cabang && !statusFilter && isAdmin
                ? { label: 'Tambah Karyawan', href: '/karyawan/tambah' }
                : undefined
            }
          />
        ) : (
          <div className="divide-y divide-border/60">
            {rows.map((emp: any) => {
              const c = emp.contracts?.[0]
              const daysLeft = c ? differenceInDays(new Date(c.traineeSelesai), now) : null
              const isKritis = daysLeft !== null && daysLeft <= 14 && daysLeft >= 0

              return (
                <div
                  key={emp.id}
                  className={cn(
                    'px-4 py-4 flex items-start gap-3',
                    isKritis && 'bg-red-50/40'
                  )}
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <User size={16} className="text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{emp.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c?.posisi || '—'} · {emp.cabang}
                        </p>
                      </div>
                      {getStatusChip(emp)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 mt-0.5 rounded text-muted-foreground/70 hover:text-foreground/70 hover:bg-muted">
                        <DotsThreeVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                        <Link href={`/karyawan/${emp.id}`}>
                          <Eye className="h-4 w-4 text-muted-foreground/70" /> Lihat Detail
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                            <Link href={`/karyawan/${emp.id}/edit`}>
                              <Pencil className="h-4 w-4 text-muted-foreground/70" /> Edit Profil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                            <Link href={`/karyawan/${emp.id}/kontrak`}>
                              <ClockCounterClockwise className="h-4 w-4 text-muted-foreground/70" /> Kelola Kontrak
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash className="h-4 w-4" /> Hapus Data
                              </DropdownMenuItem>
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
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ya, Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })}
          </div>
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 bg-muted/50">
            <p className="text-xs text-muted-foreground">
              Hal. {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <PgBtn onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })} disabled={page <= 1}>
                <CaretLeft size={14} />
              </PgBtn>
              <PgBtn onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })} disabled={page >= totalPages}>
                <CaretRight size={14} />
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
}: {
  icon: React.ReactNode
  iconBg: string
  value: number
  label: string
  primary?: boolean
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'rounded-lg p-4 flex items-center gap-3 shadow-sm',
      primary
        ? 'bg-primary'
        : highlight
          ? 'bg-card border border-amber-200'
          : 'bg-card border border-border'
    )}>
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div>
        <p className={cn('text-2xl font-bold leading-none', primary ? 'text-white' : 'text-foreground')}>
          {value.toLocaleString('id-ID')}
        </p>
        <p className={cn('text-xs mt-1', primary ? 'text-blue-100' : 'text-muted-foreground')}>
          {label}
        </p>
      </div>
    </div>
  )
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
