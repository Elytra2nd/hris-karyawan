import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { startOfDay, differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  Users, UserCheck, UserX, AlertTriangle,
  TrendingUp, Building2, MapPin, Clock,
  PlusCircle, Calendar, ChevronRight, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ContractStatusChart } from '@/components/contract-status-chart'
import { EmployeeChart } from '@/components/employee-chart'

export default async function DashboardPage() {
  const user = await verifySession()
  const now = new Date()
  const today = startOfDay(now)

  const [totalEmployees, activeEmployees, statsBranch, recentContracts] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'AKTIF' } }),
    prisma.employee.groupBy({
      by: ['ba', 'baCabang', 'cabang', 'region'],
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

  const nonActive = totalEmployees - activeEmployees
  const activePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0

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
    .slice(0, 6)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam'

  return (
    <div className="space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.username || 'Pengguna'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Calendar size={13} />
            {format(now, "EEEE, dd MMMM yyyy", { locale: localeID })}
          </p>
        </div>
        {user?.role === 'ADMIN' && (
          <Link href="/karyawan/tambah">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              <PlusCircle size={15} />
              Tambah Karyawan
            </button>
          </Link>
        )}
      </div>

      {/* ─── Alert Banner ─── */}
      {expiring14.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">
              {expiring14.length} kontrak berakhir dalam 14 hari ke depan
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              Segera ambil tindakan perpanjangan atau penghentian kontrak.
            </p>
          </div>
          <Link
            href="/karyawan"
            className="text-sm font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 shrink-0 mt-0.5"
          >
            Lihat <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {expiring30.length > 0 && expiring14.length === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {expiring30.length} kontrak berakhir dalam 30 hari ke depan
            </p>
            <p className="text-sm text-amber-600 mt-0.5">Perlu perhatian tim HR.</p>
          </div>
          <Link
            href="/karyawan"
            className="text-sm font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0 mt-0.5"
          >
            Lihat <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total — highlighted primary */}
        <div className="bg-primary rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{totalEmployees}</p>
            <p className="text-xs text-blue-100 mt-1">Total Trainee</p>
          </div>
        </div>

        {/* Aktif */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{activeEmployees}</p>
            <p className="text-xs text-gray-500 mt-1">Aktif ({activePercent}%)</p>
          </div>
        </div>

        {/* Kritis ≤30 hari */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{expiring30.length}</p>
            <p className="text-xs text-gray-500 mt-1">Kontrak ≤ 30 hari</p>
          </div>
        </div>

        {/* Non-aktif / expired */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 leading-none">{nonActive}</p>
            <p className="text-xs text-gray-500 mt-1">Non-Aktif</p>
          </div>
        </div>
      </div>

      {/* ─── 2-Column: Kontrak Segera Habis + Ringkasan ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Kontrak Segera Habis */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">Kontrak Perlu Tindakan</h2>
            </div>
            <span className="text-xs text-muted-foreground">{expiring90.length} kontrak</span>
          </div>

          <div className="divide-y divide-gray-50">
            {urgentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <p className="text-sm font-semibold text-gray-500">Semua kontrak aman</p>
                <p className="text-xs text-muted-foreground">Tidak ada kontrak yang kritis</p>
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
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                        {c.employee.namaLengkap}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.posisi} · {c.employee.cabang}
                      </p>
                    </div>
                    <span className={cn(
                      'ml-3 shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
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

          {expiring90.length > 6 && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <Link
                href="/karyawan"
                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Lihat semua {expiring90.length} kontrak <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Ringkasan Status Kontrak */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-gray-800">Ringkasan Kontrak Aktif</h2>
          </div>

          <div className="px-4 pt-3">
            <ContractStatusChart
              safe={safe.length}
              warning={expiring90.length - expiring30.length}
              critical={expiring30.length}
              expired={expired.length}
            />
          </div>

          <div className="px-5 py-2 divide-y divide-gray-50 border-t border-gray-100 mt-1">
            <SummaryRow label="Kontrak Aman" sub="> 90 hari" value={safe.length} dotColor="bg-green-500" valueColor="text-green-700" />
            <SummaryRow label="Perlu Perhatian" sub="31–90 hari" value={expiring90.length - expiring30.length} dotColor="bg-amber-400" valueColor="text-amber-700" />
            <SummaryRow label="Kritis" sub="≤ 30 hari" value={expiring30.length} dotColor="bg-red-500" valueColor="text-red-700" />
            <SummaryRow label="Sudah Berakhir" sub="Expired" value={expired.length} dotColor="bg-gray-300" valueColor="text-gray-500" />
          </div>

          <div className="px-5 pt-3 pb-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-gray-800">Total Karyawan Aktif</span>
              <span className="font-bold text-gray-900">{activeEmployees}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Non-Aktif / Keluar</span>
              <span className="text-muted-foreground">{nonActive}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2-Column Charts: Distribusi Posisi + Sebaran Cabang ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Distribusi Posisi */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Distribusi Posisi</h2>
              <p className="text-xs text-muted-foreground">Berdasarkan kontrak terakhir aktif</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            <EmployeeChart data={statsPosisi} />
          </div>
        </div>

        {/* Sebaran per Cabang */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <div className="h-7 w-7 rounded-md bg-green-50 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Sebaran per Cabang</h2>
              <p className="text-xs text-muted-foreground">Karyawan aktif per lokasi</p>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {statsCabang.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6 px-5">Tidak ada data</p>
            ) : statsCabang.map(([cabang, count], i) => {
              const pct = activeEmployees > 0 ? Math.round((count / activeEmployees) * 100) : 0
              const dotColors = [
                'bg-blue-500', 'bg-emerald-500', 'bg-orange-400', 'bg-red-400',
                'bg-violet-500', 'bg-pink-400', 'bg-cyan-500', 'bg-lime-500',
              ]
              return (
                <div key={cabang} className="flex items-center gap-3 px-5 py-3">
                  <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColors[i % dotColors.length])} />
                  <span className="text-sm font-medium text-gray-700 flex-1 truncate">{cabang}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Tabel Branch Overview ─── */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">Integrasi Branch</h2>
            <p className="text-xs text-muted-foreground">Distribusi karyawan per kode cabang</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b border-gray-200 bg-blue-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kode BA</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Cabang</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Region</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Jumlah</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Proporsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statsBranch.map((b, i) => {
                const pct = totalEmployees > 0 ? Math.round((b._count.ba / totalEmployees) * 100) : 0
                return (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-gray-100 text-xs font-bold text-gray-800 font-mono">
                        {b.ba}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-gray-800">{b.baCabang}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{b.region}</td>
                    <td className="px-5 py-3.5 text-center text-base font-bold text-gray-900">{b._count.ba}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

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
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2.5">
        <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColor)} />
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs text-muted-foreground hidden sm:inline">{sub}</span>
      </div>
      <span className={cn('text-base font-bold', valueColor)}>{value}</span>
    </div>
  )
}
