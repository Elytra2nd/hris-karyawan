import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { getDashboardKPI } from '@/app/actions/employee'
import { startOfDay, differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  Users, UserCheck, UserMinusIcon, Warning,
  Clock, Bell,
  PlusCircle, Calendar,
  ShieldWarning,
} from '@phosphor-icons/react/ssr'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { DashboardVisualizations } from '@/components/dashboard-visualizations'
import { OpenNotificationsButton } from '@/components/open-notifications-button'
import { LiveClock } from '@/components/live-clock'

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

  // ── Data ringkas untuk komponen visualisasi (filter per-chart di client) ──
  const vizData = recentContracts.map(c => ({
    cabang: c.employee.cabang,
    posisi: c.posisi,
    daysLeft: differenceInDays(new Date(c.traineeSelesai), today),
  }))
  const vizBranches = [...new Map(statsBranch.map(b => [b.cabang, b.baCabang])).entries()]
    .map(([code, label]) => ({ code, label }))
    .sort((a, b) => a.code.localeCompare(b.code))
  const vizPositions = [...new Set(recentContracts.map(c => c.posisi))].sort()

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
              Tambah Trainee
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
        type Alert = { tone: keyof typeof TONES; Icon: typeof Warning; msg: string; short: string }
        const alerts = ([
          kpi.expiring14 > 0 && { tone: 'red', Icon: Warning, msg: `${kpi.expiring14} kontrak berakhir dalam 14 hari`, short: `${kpi.expiring14} kritis ≤14 hari` },
          kpi.contractExpired > 0 && { tone: 'orange', Icon: ShieldWarning, msg: `${kpi.contractExpired} trainee aktif tapi kontrak sudah berakhir`, short: `${kpi.contractExpired} expired` },
          kpi.expiring30 > kpi.expiring14 && { tone: 'amber', Icon: Clock, msg: `${kpi.expiring30} kontrak berakhir dalam 30 hari`, short: `${kpi.expiring30} ≤30 hari` },
        ].filter(Boolean) as Alert[])
        if (alerts.length === 0) return null
        const [primary, ...others] = alerts
        const t = TONES[primary.tone]
        return (
          <div className={cn('rounded-lg border px-4 py-3', t.wrap)} role="alert">
            <OpenNotificationsButton
              ariaLabel="Buka panel notifikasi untuk detail kontrak yang perlu tindakan"
              className="flex items-center gap-3 w-full text-left"
            >
              <primary.Icon className={cn('h-5 w-5 shrink-0', t.icon)} aria-hidden="true" />
              <p className={cn('flex-1 text-sm font-semibold min-w-0', t.text)}>{primary.msg}</p>
              <span className={cn('hidden sm:flex items-center gap-1 text-sm font-semibold shrink-0', t.link)}>
                <Bell size={15} aria-hidden="true" /> Cek Notifikasi
              </span>
              <Bell size={18} className={cn('sm:hidden shrink-0', t.link)} aria-hidden="true" />
            </OpenNotificationsButton>
            {others.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2 pl-8">
                {others.map(o => (
                  <span
                    key={o.short}
                    className={cn('text-xs font-medium px-2 py-0.5 rounded-full border border-current/20 bg-card/60', TONES[o.tone].link)}
                  >
                    {o.short}
                  </span>
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

      {/* ─── Panel Visualisasi (filter per grafik) ─── */}
      <DashboardVisualizations data={vizData} branches={vizBranches} positions={vizPositions} />

      {/* ─── FAB Tambah Trainee (mobile only) ─── */}
      {hasPermission(user?.role, 'employee_create') && (
        <Link
          href="/karyawan/tambah"
          aria-label="Tambah Trainee"
          className="sm:hidden fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all"
        >
          <PlusCircle size={26} weight="bold" />
        </Link>
      )}

    </div>
  )
}
