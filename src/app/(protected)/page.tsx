import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { getDepartmentStats, getDashboardKPI } from '@/app/actions/employee'
import { startOfDay, differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  Users, UserCheck, UserMinusIcon, Warning,
  TrendUp, Buildings, MapPin, Clock,
  PlusCircle, Calendar, CaretRight, CheckCircle,
  GridFour, ShieldWarning,
} from '@phosphor-icons/react/ssr'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ContractStatusChart, EmployeeChart } from '@/components/dashboard-charts'
import { LiveClock } from '@/components/live-clock'
import { BranchTable } from '@/components/branch-table'

export default async function DashboardPage() {
  const user = await verifySession()
  const now = new Date()
  const today = startOfDay(now)

  const [kpi, statsBranch, recentContracts, statsDepartment] = await Promise.all([
    getDashboardKPI(),
    prisma.employee.groupBy({
      by: ['ba', 'baCabang', 'cabang'],
      _count: { ba: true },
      orderBy: { _count: { ba: 'desc' } },
    }),
    prisma.contract.findMany({
      where: { employee: { status: 'AKTIF' } },
      orderBy: { traineeSelesai: 'desc' },
      distinct: ['employeeId'],
      include: { employee: { select: { namaLengkap: true, cabang: true, id: true } } },
    }),
    getDepartmentStats(),
  ])

  const expiring30 = recentContracts.filter(c => {
    const d = differenceInDays(new Date(c.traineeSelesai), today)
    return d >= 0 && d <= 30
  })
  const expiring90 = recentContracts.filter(c => {
    const d = differenceInDays(new Date(c.traineeSelesai), today)
    return d >= 0 && d <= 90
  })
  const safe = recentContracts.filter(c => differenceInDays(new Date(c.traineeSelesai), today) > 90)
  const expired = recentContracts.filter(c => differenceInDays(new Date(c.traineeSelesai), today) < 0)
  const expiring14 = expiring30.filter(c => differenceInDays(new Date(c.traineeSelesai), today) <= 14)

  const posisiMap: Record<string, number> = {}
  recentContracts.forEach(c => { posisiMap[c.posisi] = (posisiMap[c.posisi] || 0) + 1 })
  const statsPosisi = Object.entries(posisiMap).sort((a, b) => b[1] - a[1])

  const cabangMap: Record<string, number> = {}
  recentContracts.forEach(c => { cabangMap[c.employee.cabang] = (cabangMap[c.employee.cabang] || 0) + 1 })
  const statsCabang = Object.entries(cabangMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const urgentList = [...expiring14, ...expiring30.filter(c => !expiring14.includes(c))]
    .sort((a, b) => differenceInDays(new Date(a.traineeSelesai), today) - differenceInDays(new Date(b.traineeSelesai), today))
    .slice(0, 10)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam'

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {user?.username || 'Pengguna'}
          </h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar size={12} aria-hidden="true" />
              {format(now, "EEEE, dd MMMM yyyy", { locale: localeID })}
            </p>
            <span className="text-muted-foreground/40 hidden sm:inline">·</span>
            <p className="text-sm text-primary font-semibold flex items-center gap-2">
              <Clock size={12} aria-hidden="true" />
              <LiveClock />
            </p>
          </div>
        </div>
        {user?.role === 'ADMIN' && (
          <Link href="/karyawan/tambah">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              <PlusCircle size={16} aria-hidden="true" />
              Tambah Karyawan
            </button>
          </Link>
        )}
      </div>

      {/* ─── Status Mismatch Alert ─── */}
      {kpi.contractExpired > 0 && (
        <div className="flex items-start gap-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-4" role="alert">
          <ShieldWarning className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              {kpi.contractExpired} karyawan berstatus Aktif namun kontrak terakhirnya sudah berakhir
            </p>
            <p className="text-sm text-orange-600 mt-0.5">
              Tindakan: Perpanjang kontrak atau ubah status ke Non-Aktif.
            </p>
          </div>
          <Link
            href="/karyawan?filter=expired"
            className="text-sm font-semibold text-orange-700 hover:text-orange-800 flex items-center gap-1 shrink-0 mt-0.5"
          >
            Lihat <CaretRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* ─── Alert Banner: Kontrak ≤14 hari ─── */}
      {kpi.expiring14 > 0 && (
        <div className="flex items-start gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-4" role="alert">
          <Warning className="h-5 w-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {kpi.expiring14} kontrak berakhir dalam 14 hari ke depan
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Segera ambil tindakan perpanjangan atau penghentian kontrak.
            </p>
          </div>
          <Link
            href="/karyawan?filter=expiring14"
            className="text-sm font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 shrink-0 mt-0.5"
          >
            Lihat <CaretRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      {kpi.expiring30 > 0 && kpi.expiring14 === 0 && (
        <div className="flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4" role="alert">
          <Warning className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {kpi.expiring30} kontrak berakhir dalam 30 hari ke depan
            </p>
            <p className="text-sm text-amber-600 mt-0.5">Perlu perhatian tim HR.</p>
          </div>
          <Link
            href="/karyawan?filter=expiring30"
            className="text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0 mt-0.5"
          >
            Lihat <CaretRight size={16} aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* ─── KPI Stat Cards — derived from contract data ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/karyawan" className="group bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
          <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent/70 transition-colors">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Total Trainee</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.totalAll}</p>
          </div>
        </Link>

        <Link href="/karyawan?status=AKTIF" className="group bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <UserCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Kontrak Aktif ({kpi.validPercent}%)</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.contractValid}</p>
          </div>
        </Link>

        <Link href="/karyawan?filter=expiring30" className="group bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Segera Habis ≤ 30 hari</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.expiring30}</p>
          </div>
        </Link>

        <Link href="/karyawan?filter=expired" className="group bg-card border border-border rounded-2xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-rose-200 transition-all">
          <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition-colors">
            <UserMinusIcon className="h-6 w-6 text-rose-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Kontrak Expired</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.contractExpired}</p>
          </div>
        </Link>
      </div>

      {/* ─── 2-Column: Kontrak Segera Habis + Ringkasan ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kontrak Segera Habis */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-red-50 flex items-center justify-center">
                <Warning className="h-4 w-4 text-red-500" aria-hidden="true" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Kontrak Perlu Tindakan</h2>
            </div>
            <span className="text-xs text-muted-foreground">{expiring90.length} kontrak</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-border/40">
            {urgentList.length === 0 ? (
              <div className="flex items-center gap-4 px-6 py-6">
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Semua kontrak aman</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tidak ada kontrak yang perlu tindakan segera</p>
                </div>
              </div>
            ) : (
              urgentList.map((c) => {
                const days = differenceInDays(new Date(c.traineeSelesai), today)
                const isKritis = days <= 14
                const isMendekat = days > 14 && days <= 30
                return (
                  <Link
                    key={c.id}
                    href={`/karyawan/${c.employee.id}`}
                    className={cn(
                      'flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors group',
                      isKritis && 'bg-red-50/30',
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        isKritis ? 'bg-red-500' : isMendekat ? 'bg-amber-400' : 'bg-blue-400'
                      )} aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {c.employee.namaLengkap}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {c.posisi} · {c.employee.cabang}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'ml-4 shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold',
                      isKritis
                        ? 'bg-red-100 text-red-700'
                        : isMendekat
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    )}>
                      {days > 0 ? `${days} hari` : 'Expired'}
                    </span>
                  </Link>
                )
              })
            )}
          </div>

          {expiring90.length > urgentList.length && (
            <div className="px-6 py-4 border-t border-border/60 bg-muted/50">
              <Link
                href="/karyawan?filter=expiring90"
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Lihat semua {expiring90.length} kontrak <CaretRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Ringkasan Status Kontrak */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
              <TrendUp className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Ringkasan Kontrak Aktif</h2>
          </div>

          <div
            className="px-4 pt-3"
            role="img"
            aria-label={`Ringkasan status kontrak: ${safe.length} aman, ${expiring90.length - expiring30.length} perlu perhatian, ${expiring30.length} kritis, ${expired.length} berakhir`}
          >
            <ContractStatusChart
              safe={kpi.safe}
              warning={kpi.warningRange}
              critical={kpi.expiring30}
              expired={kpi.contractExpired}
            />
          </div>

          <div className="px-6 py-2 divide-y divide-gray-50 border-t border-border/60 mt-1">
            <SummaryRow label="Kontrak Aman" sub="> 90 hari" value={kpi.safe} dotColor="bg-green-500" valueColor="text-green-700" />
            <SummaryRow label="Perlu Perhatian" sub="31–90 hari" value={kpi.warningRange} dotColor="bg-amber-400" valueColor="text-amber-700" />
            <SummaryRow label="Kritis" sub="≤ 30 hari" value={kpi.expiring30} dotColor="bg-red-500" valueColor="text-red-700" />
            <SummaryRow label="Sudah Berakhir" sub="Expired" value={kpi.contractExpired} dotColor="bg-muted-foreground/40" valueColor="text-muted-foreground" />
          </div>

          <div className="px-6 pt-4 pb-4 border-t border-border/60 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-foreground">Kontrak Valid</span>
              <span className="font-bold text-emerald-600">{kpi.contractValid}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Karyawan Aktif (status)</span>
              <span className="text-muted-foreground">{kpi.totalAktif}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Non-Aktif / Keluar</span>
              <span className="text-muted-foreground">{kpi.totalNonAktif}</span>
            </div>
            {kpi.noContract > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">Aktif tanpa kontrak</span>
                <span className="text-amber-600 font-semibold">{kpi.noContract}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2-Column Charts: Distribusi Posisi + Sebaran Cabang ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribusi Posisi */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
              <TrendUp className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Distribusi Posisi</h2>
              <p className="text-xs text-muted-foreground">Berdasarkan kontrak terakhir aktif</p>
            </div>
          </div>
          <div
            className="px-4 pb-4"
            role="img"
            aria-label={`Distribusi posisi karyawan: ${statsPosisi.map(([p, n]) => `${p} ${n} orang`).join(', ') || 'tidak ada data'}`}
          >
            <EmployeeChart data={statsPosisi} />
          </div>
        </div>

        {/* Sebaran per Cabang */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-green-50 flex items-center justify-center">
              <Buildings className="h-4 w-4 text-green-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Sebaran per Cabang</h2>
              <p className="text-xs text-muted-foreground">Karyawan aktif per lokasi</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {statsCabang.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 px-6">Tidak ada data</p>
            ) : statsCabang.map(([cabang, count], i) => {
              const pct = kpi.totalAktif > 0 ? Math.round((count / kpi.totalAktif) * 100) : 0
              const dotColors = [
                'bg-blue-500', 'bg-emerald-500', 'bg-orange-400', 'bg-red-400',
                'bg-violet-500', 'bg-pink-400', 'bg-teal-500', 'bg-lime-500',
              ]
              return (
                <div key={cabang} className="flex items-center gap-4 px-6 py-4">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColors[i % dotColors.length])} aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground/80 flex-1 truncate">{cabang}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Sebaran per Departemen ─── */}
      {statsDepartment.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-violet-50 flex items-center justify-center">
                <GridFour className="h-4 w-4 text-violet-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Sebaran per Departemen</h2>
                <p className="text-xs text-muted-foreground">Karyawan aktif per unit kerja</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{statsDepartment.length} departemen</span>
          </div>
          <div className="divide-y divide-gray-50">
            {statsDepartment.map((dept, i) => {
              const pct = kpi.totalAktif > 0 ? Math.round((dept.count / kpi.totalAktif) * 100) : 0
              const dotColors = [
                'bg-violet-500', 'bg-fuchsia-500', 'bg-indigo-500', 'bg-purple-400',
                'bg-sky-500', 'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500',
              ]
              return (
                <div key={dept.departmentId ?? 'unassigned'} className="flex items-center gap-4 px-6 py-4">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColors[i % dotColors.length])} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground/80 truncate block">{dept.name}</span>
                    {dept.code !== '-' && (
                      <span className="text-xs text-muted-foreground">{dept.code}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground">{dept.count}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── Tabel Branch Overview (dengan paginasi) ─── */}
      <BranchTable
        data={statsBranch.map(b => ({
          ba: b.ba,
          baCabang: b.baCabang,
          cabang: b.cabang,
          count: b._count.ba,
        }))}
        totalEmployees={kpi.totalAll}
      />

    </div>
  )
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function SummaryRow({
  label,
  sub,
  value,
  dotColor,
  valueColor,
}: {
  label: string
  sub: string
  value: number
  dotColor: string
  valueColor: string
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColor)} aria-hidden="true" />
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{sub}</span>
      </div>
      <span className={cn('text-base font-bold', valueColor)}>{value}</span>
    </div>
  )
}
