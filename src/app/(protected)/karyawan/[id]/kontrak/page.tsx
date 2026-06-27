import { requirePermission } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { createContract } from '@/app/actions/employee'
import { ContractForm } from '@/components/contract-form'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaretLeft, Warning, ClockCounterClockwise, CheckCircle } from '@phosphor-icons/react/ssr'
import { format, differenceInDays } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function TambahKontrakPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission('contract_create')

  const { id } = await params
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      namaLengkap: true,
      cabang: true,
      status: true,
      contracts: { orderBy: { traineeSelesai: 'desc' }, take: 1 },
    },
  })
  if (!employee) notFound()

  const latestContract = employee.contracts[0]
  const daysToExpiry = latestContract
    ? differenceInDays(new Date(latestContract.traineeSelesai), new Date())
    : null

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ─── Back link (konsisten dengan tambah/edit) ─── */}
      <Link
        href={`/karyawan/${id}`}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <CaretLeft size={16} />
        Kembali ke Detail Karyawan
      </Link>

      {/* ─── Page Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kelola Kontrak</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Menerbitkan kontrak baru untuk{' '}
          <span className="font-semibold text-foreground">{employee.namaLengkap}</span>
          {employee.cabang && (
            <span> · {employee.cabang}</span>
          )}
        </p>
      </div>

      <div className="max-w-2xl space-y-8">

        {/* ─── Kontrak Berjalan (if exists) ─── */}
        {latestContract && (
          <div
            role="region"
            aria-label="Informasi kontrak berjalan"
            className={`rounded-lg border px-4 py-4 flex items-start gap-4 ${
              daysToExpiry !== null && daysToExpiry < 0
                ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
                : daysToExpiry !== null && daysToExpiry <= 30
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
                  : 'bg-muted/50 border-border'
            }`}
          >
            <ClockCounterClockwise size={16} aria-hidden="true" className={`shrink-0 mt-0.5 ${
              daysToExpiry !== null && daysToExpiry < 0
                ? 'text-red-600'
                : daysToExpiry !== null && daysToExpiry <= 30
                  ? 'text-amber-600'
                  : 'text-muted-foreground/70'
            }`} />
            <div className="text-sm space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">Kontrak Berjalan</p>
                <Badge variant="secondary" className="uppercase">{latestContract.posisi}</Badge>
              </div>
              <p className="text-muted-foreground">
                {format(new Date(latestContract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}
                {' → '}
                {format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
              </p>
              {daysToExpiry !== null && (
                <span
                  role="status"
                  aria-label={daysToExpiry < 0 ? 'Kontrak sudah expired' : `Sisa ${daysToExpiry} hari`}
                  className={
                    daysToExpiry < 0
                      ? 'chip-expired'
                      : daysToExpiry <= 30
                        ? 'chip-warning'
                        : 'chip-aktif'
                  }
                >
                  {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} hari lalu` : `Sisa ${daysToExpiry} hari`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ─── Form Card ─── */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {/* Required field legend — WCAG */}
          <p className="text-xs text-muted-foreground mb-6">
            Kolom bertanda <span className="text-red-500 font-semibold">*</span> wajib diisi
          </p>
          <ContractForm employeeId={id} action={createContract} />
        </div>

        {/* ─── Aturan Kontrak ─── */}
        <div
          role="note"
          aria-label="Aturan durasi kontrak"
          className="flex items-start gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 dark:bg-amber-950/30 dark:border-amber-900/50"
        >
          <Warning size={16} className="text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Aturan Durasi Kontrak</p>
            <ul className="mt-2 space-y-1.5 text-amber-700 dark:text-amber-300" aria-label="Daftar aturan durasi kontrak">
              <li className="flex items-center gap-2">
                <CheckCircle size={12} className="text-amber-500 shrink-0" aria-hidden="true" />
                Jabatan <strong>Administrator</strong> → otomatis <strong>3 bulan</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={12} className="text-amber-500 shrink-0" aria-hidden="true" />
                Jabatan lainnya → otomatis <strong>6 bulan</strong>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
