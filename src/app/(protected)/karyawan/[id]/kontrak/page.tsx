import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { createContract } from '@/app/actions/employee'
import { ContractForm } from '@/components/contract-form'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CaretLeft, Warning, ClockCounterClockwise, CheckCircle } from '@phosphor-icons/react/ssr'
import { format, differenceInDays } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function TambahKontrakPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (session?.role !== 'ADMIN') redirect('/karyawan')

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
    <div className="space-y-5">

      {/* ─── Breadcrumb ─── */}
      <Link
        href={`/karyawan/${id}`}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <CaretLeft size={16} />
        Kembali ke Detail Karyawan
      </Link>

      {/* ─── Page header ─── */}
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

      <div className="max-w-lg space-y-4">

        {/* Kontrak berjalan saat ini */}
        {latestContract && (
          <div className={`rounded-lg border px-4 py-3.5 flex items-start gap-3 ${
            daysToExpiry !== null && daysToExpiry <= 30
              ? 'bg-amber-50 border-amber-200'
              : 'bg-muted/50 border-border'
          }`}>
            <ClockCounterClockwise size={16} className={`shrink-0 mt-0.5 ${
              daysToExpiry !== null && daysToExpiry <= 30 ? 'text-amber-600' : 'text-muted-foreground/70'
            }`} />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Kontrak Berjalan</p>
              <p className="text-muted-foreground mt-0.5">
                {latestContract.posisi} ·{' '}
                {format(new Date(latestContract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}
                {' → '}
                {format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
                {daysToExpiry !== null && (
                  <span className={`ml-2 font-semibold ${
                    daysToExpiry < 0 ? 'text-red-600' : daysToExpiry <= 30 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    ({daysToExpiry < 0 ? 'Expired' : `sisa ${daysToExpiry} hari`})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <ContractForm employeeId={id} action={createContract} />
        </div>

        {/* Aturan kontrak */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5">
          <Warning size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Aturan Durasi Kontrak</p>
            <ul className="mt-1.5 space-y-1 text-amber-700">
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-amber-500 shrink-0" />
                Jabatan <strong>Administrator</strong> → otomatis <strong>3 bulan</strong>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-amber-500 shrink-0" />
                Jabatan lainnya → otomatis <strong>6 bulan</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
