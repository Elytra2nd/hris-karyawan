import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { getDashboardKPI } from '@/app/actions/employee'
import { startOfDay, differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  Users, UserCheck, UserMinusIcon, Warning,
  TrendUp, Buildings, MapPin, Clock,
  PlusCircle, Calendar, CaretRight, CheckCircle,
  ShieldWarning,
} from '@phosphor-icons/react/ssr'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ContractStatusChart, EmployeeChart } from '@/components/dashboard-charts'
import { LiveClock } from '@/components/live-clock'
import { BranchTable } from '@/components/branch-table'

export default async function DashboardPage() {
  const user = await verifySession()
  const now = new Date()
  const today = startOfDay(now)

  const [kpi, statsBranch, recentContracts] = await Promise.all([
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

  // Peta kode cabang → nama (baCabang) untuk label "H727 — BENUA KAYONG".
  const branchLabelByCode = new Map(statsBranch.map(b => [b.cabang, b.baCabang]))

  // Breakdown status kontrak per cabang (untuk stacked bar). Kategori sama dgn
  // donut: aman >90h, perhatian 31–90h, kritis ≤30h, expired <0.
  type CabangStatus = { aman: number; perhatian: number; kritis: number; expired: number; total: number }
  const cabangStatus = new Map<string, CabangStatus>()
  recentContracts.forEach(c => {
    const code = c.employee.cabang
    const s = cabangStatus.get(code) ?? { aman: 0, perhatian: 0, kritis: 0, expired: 0, total: 0 }
    const d = differenceInDays(new Date(c.traineeSelesai), today)
    if (d < 0) s.expired++
    else if (d <= 30) s.kritis++
    else if (d <= 90) s.perhatian++
    else s.aman++
    s.total++
    cabangStatus.set(code, s)
  })

  const urgentList = [...expiring14, ...expiring30.filter(c => !expiring14.includes(c))]
    .sort((a, b) => differenceInDays(new Date(a.traineeSelesai), today) - differenceInDays(new Date(b.traineeSelesai), today))
    .slice(0, 10)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam'

  return (
    <div className="space-y-6 pb-24 sm:pb-6">

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
            <p className="text-sm text-primary font-semibold hidden sm:flex items-center gap-2">
              <Clock size={12} aria-hidden="true" />
              <LiveClock />
            </p>
          </div>
        </div>
        {hasPermission(user?.role, 'employee_create') && (
          <Link href="/karyawan/tambah" className="hidden sm:block">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              <PlusCircle size={16} aria-hidden="true" />
              Tambah Karyawan
            </button>
          </Link>
        )}
      </div>

      {/* ─── Alert prioritas: 1 banner utama (severity tertinggi) + chip sekunder ─── */}
      {(() => {
        const TONES = {
          red:    { wrap: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30', icon: 'text-red-600', text: 'text-red-800 dark:text-red-300', link: 'text-red-700 dark:text-red-400' },
          orange: { wrap: 'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/30', icon: 'text-orange-600', text: 'text-orange-800 dark:text-orange-300', link: 'text-orange-700 dark:text-orange-400' },
          amber:  { wrap: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30', icon: 'text-amber-600', text: 'text-amber-800 dark:text-amber-300', link: 'text-amber-700 dark:text-amber-400' },
        } as const
        type Alert = { tone: keyof typeof TONES; Icon: typeof Warning; msg: string; href: string; short: string }
        const alerts = ([
          kpi.expiring14 > 0 && { tone: 'red', Icon: Warning, msg: `${kpi.expiring14} kontrak berakhir dalam 14 hari`, href: '/karyawan?filter=expiring14', short: `${kpi.expiring14} kritis ≤14 hari` },
          kpi.contractExpired > 0 && { tone: 'orange', Icon: ShieldWarning, msg: `${kpi.contractExpired} karyawan aktif tapi kontrak sudah berakhir`, href: '/karyawan?filter=expired', short: `${kpi.contractExpired} expired` },
          kpi.expiring30 > kpi.expiring14 && { tone: 'amber', Icon: Clock, msg: `${kpi.expiring30} kontrak berakhir dalam 30 hari`, href: '/karyawan?filter=expiring30', short: `${kpi.expiring30} ≤30 hari` },
        ].filter(Boolean) as Alert[])
        if (alerts.length === 0) return null
        const [primary, ...others] = alerts
        const t = TONES[primary.tone]
        return (
          <div className={cn('rounded-lg border px-4 py-3', t.wrap)} role="alert">
            <Link href={primary.href} className="flex items-center gap-3">
              <primary.Icon className={cn('h-5 w-5 shrink-0', t.icon)} aria-hidden="true" />
              <p className={cn('flex-1 text-sm font-semibold min-w-0', t.text)}>{primary.msg}</p>
              <span className={cn('hidden sm:flex items-center gap-1 text-sm font-semibold shrink-0', t.link)}>
                Lihat <CaretRight size={16} aria-hidden="true" />
              </span>
              <CaretRight size={18} className={cn('sm:hidden shrink-0', t.link)} aria-hidden="true" />
            </Link>
            {others.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 pl-8">
                {others.map(o => (
                  <Link
                    key={o.href}
                    href={o.href}
                    className={cn('text-xs font-medium px-2 py-0.5 rounded-full border border-current/20 bg-card/60 hover:bg-card transition-colors', TONES[o.tone].link)}
                  >
                    {o.short}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* ─── KPI Stat Cards — derived from contract data ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/karyawan" className="group bg-card border border-border rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
          <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center shrink-0 group-hover:bg-accent/70 transition-colors">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Total Trainee</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.totalAll}</p>
          </div>
        </Link>

        <Link href="/karyawan?status=AKTIF" className="group bg-card border border-border rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
            <UserCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Kontrak Aktif ({kpi.validPercent}%)</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.contractValid}</p>
          </div>
        </Link>

        <Link href="/karyawan?filter=expiring30" className="group bg-card border border-border rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Segera Habis ≤ 30 hari</p>
            <p className="text-2xl font-bold text-foreground leading-snug mt-0.5 tracking-tight">{kpi.expiring30}</p>
          </div>
        </Link>

        <Link href="/karyawan?filter=expired" className="group bg-card border border-border rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md hover:border-rose-200 transition-all">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

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

          <div className="flex-1 divide-y divide-border/40 sm:overflow-y-auto sm:max-h-[400px]">
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
            {/* Legend disinkronkan dengan donut (opsi B): aktif = ramp biru, hanya Expired merah */}
            <SummaryRow label="Kontrak Aman" sub="> 90 hari" value={kpi.safe} dotColor="bg-blue-700" valueColor="text-foreground" />
            <SummaryRow label="Perlu Perhatian" sub="31–90 hari" value={kpi.warningRange} dotColor="bg-blue-500" valueColor="text-foreground" />
            <SummaryRow label="Kritis" sub="≤ 30 hari" value={kpi.expiring30} dotColor="bg-blue-400" valueColor="text-foreground" />
            <SummaryRow label="Sudah Berakhir" sub="Expired" value={kpi.contractExpired} dotColor="bg-red-400" valueColor="text-red-600" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

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
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-green-50 dark:bg-green-950 flex items-center justify-center">
                <Buildings className="h-4 w-4 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Sebaran per Cabang</h2>
                <p className="text-xs text-muted-foreground">Komposisi status kontrak per lokasi</p>
              </div>
            </div>
          </div>

          {/* Legend status (warna sama dgn donut) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-2 border-b border-border/40 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-700" /> Aman</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500" /> Perhatian</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-400" /> Kritis</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400" /> Expired</span>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-border/40">
            {statsCabang.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 px-6">Tidak ada data</p>
            ) : statsCabang.map(([cabang, count]) => {
              const pct = kpi.totalAktif > 0 ? Math.round((count / kpi.totalAktif) * 100) : 0
              const label = branchLabelByCode.get(cabang)
              const st = cabangStatus.get(cabang) ?? { aman: 0, perhatian: 0, kritis: 0, expired: 0, total: count }
              const total = st.total || 1
              // Tiap bar = komposisi status cabang itu (lebar segmen ∝ proporsi).
              const segments = [
                { key: 'aman', n: st.aman, cls: 'bg-blue-700', label: 'Aman' },
                { key: 'perhatian', n: st.perhatian, cls: 'bg-blue-500', label: 'Perlu Perhatian' },
                { key: 'kritis', n: st.kritis, cls: 'bg-blue-400', label: 'Kritis' },
                { key: 'expired', n: st.expired, cls: 'bg-red-400', label: 'Expired' },
              ]
              return (
                <div key={cabang} className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex-1 min-w-0 truncate text-sm">
                      <span className="font-bold text-foreground font-mono">{cabang}</span>
                      {label && <span className="text-foreground/70 font-medium"> · {label}</span>}
                    </span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
                    <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden flex cursor-default">
                        {segments.map(s => s.n > 0 && (
                          <div key={s.key} className={s.cls} style={{ width: `${(s.n / total) * 100}%` }} />
                        ))}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="flex-col items-stretch gap-1 px-3 py-2 min-w-[10rem] bg-popover text-popover-foreground border border-border shadow-md [&>svg]:fill-popover">
                      <p className="font-semibold text-foreground mb-0.5">
                        {cabang}{label ? ` · ${label}` : ''}
                      </p>
                      {segments.map(s => (
                        <div key={s.key} className="flex items-center gap-2">
                          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-[3px]', s.cls)} />
                          <span className="text-muted-foreground">{s.label}</span>
                          <span className="ml-auto pl-3 font-mono tabular-nums text-foreground">{s.n}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 border-t border-border mt-0.5 pt-1">
                        <span className="text-muted-foreground font-medium">Total</span>
                        <span className="ml-auto font-mono tabular-nums font-semibold text-foreground">{st.total}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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

      {/* ─── FAB Tambah Karyawan (mobile only) ─── */}
      {hasPermission(user?.role, 'employee_create') && (
        <Link
          href="/karyawan/tambah"
          aria-label="Tambah Karyawan"
          className="sm:hidden fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
        >
          <PlusCircle size={26} weight="bold" />
        </Link>
      )}

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
