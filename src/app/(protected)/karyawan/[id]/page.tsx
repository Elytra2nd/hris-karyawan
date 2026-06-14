import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { differenceInMonths, differenceInDays, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  User, MapPin, Phone, CreditCard, Clock,
  CalendarBlank, Buildings, SealCheckIcon,
  CheckCircle, XCircle, Warning, FileImage, FileText,
  Fingerprint, Hash,
} from '@phosphor-icons/react/ssr'
import { ContractList } from '@/components/contract-list'
import { ActivityTimeline } from '@/components/activity-timeline'
import { EmployeeDetailActions } from '@/components/employee-detail-actions'
import { cn } from '@/lib/utils'

export default async function DetailKaryawanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  const { id } = await params
  const isAdmin = session?.role === 'ADMIN'
  const canCreateContract = ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(session?.role ?? '')

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { contracts: { orderBy: { traineeSelesai: 'desc' } }, department: true },
  })
  if (!employee) notFound()

  const totalMonths = employee.contracts.reduce(
    (acc, c) =>
      acc + differenceInMonths(new Date(c.traineeSelesai), new Date(c.traineeSejak)),
    0
  )
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  const latestContract = employee.contracts[0]
  const daysToExpiry = latestContract
    ? differenceInDays(new Date(latestContract.traineeSelesai), new Date())
    : 0

  const isExpired = daysToExpiry < 0
  const isKritis = !isExpired && daysToExpiry <= 14
  const isMendekat = !isExpired && daysToExpiry > 14 && daysToExpiry <= 30

  const getStatusChip = () => {
    if (employee.status !== 'AKTIF')
      return <span className="chip-nonaktif">Non-Aktif</span>
    if (isExpired) return <span className="chip-expired">Expired</span>
    if (isKritis || isMendekat) return <span className="chip-warning">Segera Habis</span>
    return <span className="chip-aktif">Aktif</span>
  }

  return (
    <div className="space-y-5">

      {/* ─── Actions ─── */}
      <div className="flex items-center justify-end">
        <EmployeeDetailActions id={id} isAdmin={isAdmin} />
      </div>

      {/* ─── Profile Card ─── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Top: Avatar + Info */}
        <div className="flex items-start gap-5 p-6">
          {/* Avatar */}
          <div className="h-20 w-20 rounded-xl bg-accent flex items-center justify-center shrink-0 overflow-hidden border border-border">
            {employee.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={employee.image}
                alt={employee.namaLengkap}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={32} className="text-primary/40" />
            )}
          </div>

          {/* Name + Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-foreground">{employee.namaLengkap}</h1>
              {getStatusChip()}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CreditCard size={12} className="text-muted-foreground/70" />
                NIK: <span className="font-medium text-foreground/80 font-mono">{employee.nik || '—'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-muted-foreground/70" />
                {employee.cabang}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone size={12} className="text-muted-foreground/70" />
                {employee.noHp || '—'}
              </span>
              <span className="flex items-center gap-1.5">
                <Buildings size={12} className="text-muted-foreground/70" />
                {latestContract?.posisi || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border/60">
          {/* Masa kerja */}
          <div className="flex items-center gap-3 px-6 py-4 sm:border-r border-border/60">
            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <Clock size={17} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">
                Masa Kerja Akumulasi
              </p>
              <p className="text-base font-bold text-foreground mt-0.5">
                {years > 0 ? `${years} Tahun ` : ''}
                {months} Bulan
                {totalMonths === 0 && ' (Baru)'}
              </p>
            </div>
          </div>

          {/* Sisa kontrak */}
          <div className={cn(
            'flex items-center gap-3 px-6 py-4',
            isKritis ? 'bg-red-50' : isMendekat ? 'bg-amber-50' : 'bg-muted/50'
          )}>
            <div className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
              isKritis ? 'bg-red-100' : isMendekat ? 'bg-amber-100' : 'bg-green-50'
            )}>
              <CalendarBlank
                size={17}
                className={cn(
                  isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-green-600'
                )}
              />
            </div>
            <div>
              <p className={cn(
                'text-[10px] font-semibold uppercase tracking-widest',
                isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-green-600'
              )}>
                Sisa Kontrak
              </p>
              <p className="text-base font-bold text-foreground mt-0.5">
                {isExpired ? 'Kontrak Habis' : `${daysToExpiry} Hari`}
                {latestContract && (
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    s/d {format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Kritis Warning Banner ─── */}
      {(isKritis || isMendekat) && (
        <div className={cn(
          'flex items-start gap-3 rounded-lg border px-4 py-3.5',
          isKritis ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        )}>
          <Warning className={cn('h-5 w-5 shrink-0 mt-0.5', isKritis ? 'text-red-600' : 'text-amber-600')} />
          <div>
            <p className={cn('text-sm font-semibold', isKritis ? 'text-red-800' : 'text-amber-800')}>
              {isKritis
                ? `Kontrak berakhir dalam ${daysToExpiry} hari!`
                : `Kontrak berakhir dalam ${daysToExpiry} hari`}
            </p>
            <p className={cn('text-sm mt-0.5', isKritis ? 'text-red-600' : 'text-amber-600')}>
              Segera koordinasikan perpanjangan atau penyelesaian kontrak dengan karyawan.
            </p>
          </div>
        </div>
      )}

      {/* ─── Data Sections: 2-col ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Identitas Pribadi */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Identitas Pribadi</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <InfoItem label="Nama Lengkap" value={employee.namaLengkap} />
            <InfoItem label="NIK Karyawan" value={employee.nik || '—'} mono />
            <InfoItem label="No KTP" value={employee.noKtp} mono />
            <InfoItem
              label="Tanggal Lahir"
              value={
                employee.tglLahir
                  ? format(new Date(employee.tglLahir), 'dd MMMM yyyy', { locale: localeID })
                  : '—'
              }
            />
            <InfoItem label="Nama Ibu Kandung" value={employee.namaIbu} />
            <InfoItem label="No HP / WhatsApp" value={employee.noHp || '—'} />
            <InfoItem label="No Jamsostek" value={employee.noJamsostek || '—'} mono />
            <InfoItem
              label="Status Karyawan"
              value={employee.status}
              valueClassName={employee.status === 'AKTIF' ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}
            />
          </div>
        </div>

        {/* Data Operasional */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-green-50 flex items-center justify-center">
              <Buildings className="h-4 w-4 text-green-600" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Data Operasional</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
            <InfoItem label="Branch Code (BA)" value={employee.ba} mono />
            <InfoItem label="BA Cabang" value={employee.baCabang} />
            <InfoItem label="Kode Cabang" value={employee.cabang} mono />
            <InfoItem label="Posisi Terakhir" value={latestContract?.posisi || '—'} />
            <InfoItem
              label="Departemen"
              value={employee.department ? `${employee.department.name} (${employee.department.code})` : 'Belum ditugaskan'}
              valueClassName={!employee.department ? 'text-muted-foreground italic' : undefined}
            />
            <InfoItem label="Total Kontrak" value={`${employee.contracts.length} kontrak`} />
            <InfoItem
              label="Dibuat"
              value={format(new Date(employee.createdAt), 'dd MMM yyyy', { locale: localeID })}
            />
            <InfoItem
              label="Diperbarui"
              value={format(new Date(employee.updatedAt), 'dd MMM yyyy, HH:mm', { locale: localeID })}
            />
          </div>
        </div>
      </div>

      {/* ─── Dokumen ─── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
          <div className="h-8 w-8 rounded-md bg-orange-50 flex items-center justify-center">
            <SealCheckIcon className="h-4 w-4 text-orange-500" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Dokumen</h2>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DocCard
            label="Foto Karyawan"
            icon={<FileImage size={22} className="text-blue-400" />}
            available={!!employee.image}
            href={employee.image || undefined}
          />
          <DocCard
            label="Scan KTP"
            icon={<Fingerprint size={22} className="text-indigo-400" />}
            available={!!employee.ktpPath}
            href={employee.ktpPath || undefined}
          />
          <DocCard
            label="Scan KK"
            icon={<FileText size={22} className="text-violet-400" />}
            available={!!employee.kkPath}
            href={employee.kkPath || undefined}
          />
          <DocCard
            label="Form Consent"
            icon={<Hash size={22} className="text-teal-400" />}
            available={!!employee.formConsent}
            customValue={employee.formConsent || undefined}
          />
        </div>
      </div>

      {/* ─── Riwayat Kontrak ─── */}
      <ContractList employee={employee} contracts={employee.contracts} canCreateContract={canCreateContract} />

      {/* ─── Riwayat Aktivitas ─── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Riwayat Aktivitas</h2>
        <ActivityTimeline employeeId={id} />
      </div>

    </div>
  )
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function InfoItem({
  label,
  value,
  mono = false,
  valueClassName,
}: {
  label: string
  value: string
  mono?: boolean
  valueClassName?: string
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className={cn(
        'text-sm font-medium text-foreground',
        mono && 'font-mono',
        valueClassName
      )}>
        {value || '—'}
      </p>
    </div>
  )
}

function DocCard({
  label,
  icon,
  available,
  href,
  customValue,
}: {
  label: string
  icon: React.ReactNode
  available: boolean
  href?: string
  customValue?: string
}) {
  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col items-center text-center gap-2',
      available ? 'border-green-200 bg-green-50/50' : 'border-border bg-muted/50'
    )}>
      <div className={cn(
        'h-10 w-10 rounded-lg flex items-center justify-center',
        available ? 'bg-card' : 'bg-muted'
      )}>
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-foreground/70 leading-snug">{label}</p>
      {customValue ? (
        <p className="text-xs text-foreground/80 font-mono">{customValue}</p>
      ) : available ? (
        href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-green-700 flex items-center gap-1 hover:underline"
          >
            <CheckCircle size={12} /> Tersedia
          </a>
        ) : (
          <span className="text-[11px] font-semibold text-green-700 flex items-center gap-1">
            <CheckCircle size={12} /> Tersedia
          </span>
        )
      ) : (
        <span className="text-[11px] font-semibold text-muted-foreground/70 flex items-center gap-1">
          <XCircle size={12} /> Belum ada
        </span>
      )}
    </div>
  )
}
