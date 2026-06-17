import { requirePermission } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { createContract } from '@/app/actions/employee'
import { ContractForm } from '@/components/contract-form'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaretLeft, Warning, ClockCounterClockwise, CheckCircle, ArrowLeft } from '@phosphor-icons/react/ssr'
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
    <div className="space-y-8">

      {/* ─── Page Header with Back ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kelola Kontrak</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Menerbitkan kontrak baru untuk{' '}
            <span className="font-semibold text-foreground/80">{employee.namaLengkap}</span>
            {employee.cabang && (
              <span className="text-muted-foreground/70"> · {employee.cabang}</span>
            )}
          </p>
        </div>
        <Link
          href={`/karyawan/${id}`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border bg-card text-sm font-medium text-foreground/70 hover:bg-muted/50 hover:text-foreground transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Detail
        </Link>
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
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">Kontrak Berjalan</p>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground/80">{latestContract.posisi}</span>
                {' · '}
                {format(new Date(latestContract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}
                {' → '}
                {format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
              </p>
              {daysToExpiry !== null && (
                <p
                  role="status"
                  aria-label={daysToExpiry < 0 ? 'Kontrak sudah expired' : `Sisa ${daysToExpiry} hari`}
                  className={`font-semibold text-xs ${
                    daysToExpiry < 0
                      ? 'text-red-600'
                      : daysToExpiry <= 30
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }`}
                >
                  {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} hari lalu` : `Sisa ${daysToExpiry} hari`}
                </p>
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
