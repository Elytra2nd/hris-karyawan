'use client'

import { useState, useEffect, useMemo } from 'react'
import { getEmployees, deleteEmployee } from '@/app/actions/employee'
import {
  Loader2, Eye, Pencil, FileClock, Trash2, Search,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
  Plus, MoreVertical, ChevronLeft, ChevronRight,
  Download, User, XCircle, CheckCircle2, Clock, AlertTriangle,
  Phone,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

const PER_PAGE = 10
type SortKey = 'namaLengkap' | 'nik' | 'posisi' | 'cabang' | 'traineeSelesai' | ''

export default function DataKaryawanPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cabang, setCabang] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [sortCol, setSortCol] = useState<SortKey>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [showFilter, setShowFilter] = useState(false)

  const { role } = useSidebar()
  const isAdmin = role === 'ADMIN'

  const fetchData = async () => {
    setLoading(true)
    const data = await getEmployees({ search, cabang, status: statusFilter })
    setEmployees(data)
    setLoading(false)
    setPage(1)
  }
  useEffect(() => { fetchData() }, [search, cabang, statusFilter])

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
    try {
      const r = await deleteEmployee(id)
      if (r.success) { toast.success(`${name} berhasil dihapus`); await fetchData() }
      else toast.error(r.error || 'Gagal menghapus')
    } catch { toast.error('Gagal menghubungkan ke server') }
    finally { setIsDeleting(null) }
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
      return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600"><AlertTriangle size={11} /> {d}h</span>
    }
    if (d <= 30) {
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600"><Clock size={11} /> {d}h</span>
    }
    if (d <= 90) {
      return <span className="text-[11px] font-medium text-gray-500">{d}h</span>
    }
    return <span className="inline-flex items-center gap-1 text-[11px] text-green-600"><CheckCircle2 size={11} /> {d}h</span>
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortCol !== col) return <ArrowUpDown size={13} className="ml-1 text-gray-300 inline-block" />
    return sortDir === 'asc'
      ? <ArrowUp size={13} className="ml-1 text-primary inline-block" />
      : <ArrowDown size={13} className="ml-1 text-primary inline-block" />
  }

  return (
    <div className="space-y-5">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Karyawan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manajemen data trainee Astra Motor Kalimantan Barat
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <ExportExcelButton variant="default" />}
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
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-600">
          <Eye size={15} className="text-gray-400 shrink-0" />
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
          icon={<CheckCircle2 size={18} className="text-green-600" />}
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
          icon={<XCircle size={18} className="text-gray-400" />}
          iconBg="bg-gray-50"
          value={stats.nonAktif}
          label="Non-Aktif"
        />
      </div>

      {/* ─── Search + Filter Toolbar ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, atau posisi..."
              className="w-full h-9 pl-9 pr-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
                  : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
              )}>
                <ArrowUpDown size={14} />
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

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center gap-2 h-9 px-3 text-sm border rounded-md transition-colors',
              showFilter
                ? 'border-primary text-primary bg-accent font-semibold'
                : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal size={14} />
            Filter
            {(cabang || statusFilter) && (
              <span className="h-2 w-2 rounded-full bg-primary ml-0.5" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="flex flex-wrap gap-3 px-4 py-3 rounded-md bg-gray-50 border border-gray-200">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cabang</label>
              <select
                value={cabang}
                onChange={(e) => setCabang(e.target.value)}
                className="h-8 px-2 pr-7 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Cabang</option>
                {cabangOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 pr-7 text-sm border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="NON-AKTIF">Non-Aktif</option>
              </select>
            </div>
            {(cabang || statusFilter) && (
              <button
                onClick={() => { setCabang(''); setStatusFilter('') }}
                className="self-end h-8 px-3 text-xs font-semibold text-gray-500 hover:text-red-600 border border-gray-200 rounded-md bg-white hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Table (Desktop) ─── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-gray-200 bg-blue-50/60">
                <th className="w-10 px-4 py-3 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-primary" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('namaLengkap')}
                >
                  Nama Karyawan <SortIcon col="namaLengkap" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('nik')}
                >
                  NIK <SortIcon col="nik" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('posisi')}
                >
                  Posisi <SortIcon col="posisi" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('cabang')}
                >
                  Cabang <SortIcon col="cabang" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Trainee Sejak
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('traineeSelesai')}
                >
                  Selesai <SortIcon col="traineeSelesai" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sisa
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Memuat data...</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <Search size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">Tidak ada data ditemukan</p>
                    <p className="text-xs text-muted-foreground mt-1">Coba ubah filter atau kata kunci pencarian</p>
                  </td>
                </tr>
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
                        'hover:bg-gray-50 transition-colors group',
                        isKritis && 'bg-red-50/40',
                        isMendekat && !isKritis && 'bg-amber-50/30',
                      )}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 accent-primary" />
                      </td>
                      {/* Nama */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {emp.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={emp.image} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                              <User size={15} className="text-primary" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
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
                      <td className="px-4 py-3.5 text-sm text-gray-700">
                        {c?.posisi || '—'}
                      </td>
                      {/* Cabang */}
                      <td className="px-4 py-3.5 text-sm text-gray-700">{emp.cabang}</td>
                      {/* Sejak */}
                      <td className="px-4 py-3.5 text-sm text-gray-600">{c ? fmtDate(c.traineeSejak) : '—'}</td>
                      {/* Selesai */}
                      <td className={cn(
                        'px-4 py-3.5 text-sm font-medium',
                        isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-gray-700'
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
                            <button className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                              <Link href={`/karyawan/${emp.id}`}>
                                <Eye className="h-4 w-4 text-gray-400" />
                                Lihat Detail
                              </Link>
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                                  <Link href={`/karyawan/${emp.id}/edit`}>
                                    <Pencil className="h-4 w-4 text-gray-400" />
                                    Edit Profil
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                                  <Link href={`/karyawan/${emp.id}/kontrak`}>
                                    <FileClock className="h-4 w-4 text-gray-400" />
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
                                      <Trash2 className="h-4 w-4" />
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
                                          ? <Loader2 size={14} className="animate-spin mr-1.5 inline" />
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-muted-foreground">
              {sortedEmployees.length === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, sortedEmployees.length)}`} dari{' '}
              <span className="font-semibold text-gray-700">{sortedEmployees.length}</span> karyawan
            </p>
            <div className="flex items-center gap-1">
              <PgBtn onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} />
              </PgBtn>
              {pageNums.map((p, i) =>
                typeof p === 'number' ? (
                  <PgBtn key={i} active={page === p} onClick={() => setPage(p)}>
                    {p}
                  </PgBtn>
                ) : (
                  <span key={i} className="px-1 text-gray-400 text-sm select-none">···</span>
                )
              )}
              <PgBtn onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                <ChevronRight size={14} />
              </PgBtn>
            </div>
          </div>
        )}
      </div>

      {/* ─── Mobile Card View ─── */}
      <div className="md:hidden bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-4">
            <Search size={32} className="text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">Tidak ada data ditemukan</p>
            <p className="text-xs text-muted-foreground">Coba ubah filter atau kata kunci</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
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
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={16} className="text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{emp.namaLengkap}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c?.posisi || '—'} · {emp.cabang}
                        </p>
                      </div>
                      {getStatusChip(emp)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {emp.nik && (
                        <span className="text-xs font-mono text-primary bg-blue-50 px-2 py-0.5 rounded">
                          {emp.nik}
                        </span>
                      )}
                      {c && (
                        <span className="text-xs text-gray-500">
                          Selesai: <span className={cn('font-medium', isKritis ? 'text-red-600' : 'text-gray-700')}>
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
                      <button className="p-1 mt-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                        <Link href={`/karyawan/${emp.id}`}>
                          <Eye className="h-4 w-4 text-gray-400" /> Lihat Detail
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                            <Link href={`/karyawan/${emp.id}/edit`}>
                              <Pencil className="h-4 w-4 text-gray-400" /> Edit Profil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer text-sm">
                            <Link href={`/karyawan/${emp.id}/kontrak`}>
                              <FileClock className="h-4 w-4 text-gray-400" /> Kelola Kontrak
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-sm text-red-600 focus:text-red-600 focus:bg-red-50"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4" /> Hapus Data
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-muted-foreground">
              Hal. {page} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <PgBtn onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                <ChevronLeft size={14} />
              </PgBtn>
              <PgBtn onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                <ChevronRight size={14} />
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
          ? 'bg-white border border-amber-200'
          : 'bg-white border border-gray-200'
    )}>
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', iconBg)}>
        {icon}
      </div>
      <div>
        <p className={cn('text-2xl font-bold leading-none', primary ? 'text-white' : 'text-gray-900')}>
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
            ? 'text-gray-300 border-gray-200 bg-white cursor-not-allowed'
            : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'
      )}
    >
      {children}
    </button>
  )
}
