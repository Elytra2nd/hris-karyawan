'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { format, differenceInDays, differenceInMonths } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { ClockCounterClockwise, CheckCircle, XCircle, Clock, Warning, Plus, ArrowBendUpRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Employee, ContractListItem } from '@/types'

const PDFButton = dynamic(() => import('@/components/pdf-button'), {
  ssr: false,
  loading: () => (
    <span className="text-xs text-muted-foreground/70 font-medium px-2">Memuat...</span>
  ),
})

export function ContractList({
  employee,
  contracts,
  canCreateContract = false,
}: {
  employee: Employee
  contracts: ContractListItem[]
  canCreateContract?: boolean
}) {
  const now = new Date()

  if (contracts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
          <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center">
            <ClockCounterClockwise className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Riwayat Kontrak</h2>
          <span className="ml-auto text-xs text-muted-foreground">0 kontrak</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <ClockCounterClockwise size={32} className="text-muted-foreground/50" />
          <p className="text-sm font-semibold text-muted-foreground">Belum ada riwayat kontrak</p>
          <p className="text-xs text-muted-foreground">Tambahkan kontrak pertama karyawan ini</p>
          <Button asChild size="sm" className="mt-1 gap-1.5">
            <Link href={`/karyawan/${employee.id}/kontrak`}>
              <Plus size={13} />
              Buat Kontrak Pertama
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
        <div className="h-7 w-7 rounded-md bg-accent flex items-center justify-center">
          <ClockCounterClockwise className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Riwayat Kontrak</h2>
          <p className="text-xs text-muted-foreground">Perjalanan kontrak trainee dari awal hingga sekarang</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{contracts.length} kontrak</span>
          {canCreateContract && (
            <Button asChild size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
              <Link href={`/karyawan/${employee.id}/kontrak`}>
                <Plus size={12} />
                Perpanjang
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider w-6">No</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Jabatan / Posisi</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Periode</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">Durasi</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">Dokumen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {contracts.map((contract, index) => {
              const isActive = index === 0
              const isExpired = new Date(contract.traineeSelesai) < now
              const daysLeft = differenceInDays(new Date(contract.traineeSelesai), now)
              const durationMonths = differenceInMonths(
                new Date(contract.traineeSelesai),
                new Date(contract.traineeSejak)
              )
              const isKritis = isActive && !isExpired && daysLeft <= 14
              const isMendekat = isActive && !isExpired && daysLeft > 14 && daysLeft <= 30

              return (
                <tr
                  key={contract.id}
                  className={cn(
                    'hover:bg-muted/50 transition-colors',
                    isKritis && 'bg-red-50/40',
                    isMendekat && !isKritis && 'bg-amber-50/30',
                  )}
                >
                  {/* No */}
                  <td className="px-5 py-4 text-sm text-muted-foreground font-mono">
                    {contracts.length - index}
                  </td>

                  {/* Jabatan */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                      )}
                      <span className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-foreground' : 'text-foreground/70'
                      )}>
                        {contract.posisi}
                      </span>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2 mt-1 ml-4">
                        <p className="text-xs text-muted-foreground">Kontrak berjalan</p>
                        {canCreateContract && (
                          <Link
                            href={`/karyawan/${employee.id}/kontrak`}
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            <ArrowBendUpRight size={11} />
                            Perpanjang
                          </Link>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Periode */}
                  <td className="px-5 py-4 text-sm text-foreground/70">
                    <div>
                      {format(new Date(contract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}
                      <span className="mx-2 text-muted-foreground/50">→</span>
                      <span className={cn(
                        isKritis ? 'text-red-600 font-semibold' : isMendekat ? 'text-amber-600 font-medium' : ''
                      )}>
                        {format(new Date(contract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
                      </span>
                    </div>
                    {isActive && !isExpired && (
                      <div className={cn(
                        'flex items-center gap-1 mt-1 text-xs',
                        isKritis ? 'text-red-600' : isMendekat ? 'text-amber-600' : 'text-green-600'
                      )}>
                        {isKritis ? (
                          <><Warning size={11} /> {daysLeft} hari tersisa</>
                        ) : isMendekat ? (
                          <><Clock size={11} /> {daysLeft} hari tersisa</>
                        ) : (
                          <><CheckCircle size={11} /> {daysLeft} hari tersisa</>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Durasi */}
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/70 bg-muted px-2.5 py-1 rounded-full">
                      <Clock size={11} />
                      {durationMonths} bln
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4 text-center">
                    {isActive && !isExpired ? (
                      <span className="chip-aktif">Berjalan</span>
                    ) : (
                      <span className="chip-nonaktif">Selesai</span>
                    )}
                  </td>

                  {/* PDF */}
                  <td className="px-5 py-4 text-center">
                    <PDFButton employee={employee} contract={contract} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Timeline */}
      <div className="sm:hidden divide-y divide-border/60">
        {contracts.map((contract, index) => {
          const isActive = index === 0
          const isExpired = new Date(contract.traineeSelesai) < now
          const daysLeft = differenceInDays(new Date(contract.traineeSelesai), now)
          const durationMonths = differenceInMonths(
            new Date(contract.traineeSelesai),
            new Date(contract.traineeSejak)
          )
          const isKritis = isActive && !isExpired && daysLeft <= 14

          return (
            <div
              key={contract.id}
              className={cn(
                'px-5 py-4 flex items-start gap-3',
                isKritis && 'bg-red-50/40'
              )}
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center gap-1 shrink-0 mt-1">
                <div className={cn(
                  'h-3 w-3 rounded-full border-2',
                  isActive && !isExpired
                    ? 'border-green-500 bg-green-500'
                    : 'border-border bg-card'
                )} />
                {index < contracts.length - 1 && (
                  <div className="w-px h-full bg-border min-h-[20px]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className={cn(
                    'text-sm font-semibold',
                    isActive ? 'text-foreground' : 'text-foreground/70'
                  )}>
                    {contract.posisi}
                  </p>
                  {isActive && !isExpired
                    ? <span className="chip-aktif">Berjalan</span>
                    : <span className="chip-nonaktif">Selesai</span>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(contract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}
                  {' → '}
                  {format(new Date(contract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {durationMonths} bulan
                  </span>
                  <PDFButton employee={employee} contract={contract} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3 border-t border-border/60 bg-muted/50 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Total akumulasi:{' '}
          <span className="font-semibold text-foreground/80">
            {contracts.reduce(
              (acc, c) =>
                acc + differenceInMonths(new Date(c.traineeSelesai), new Date(c.traineeSejak)),
              0
            )}{' '}
            bulan
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {contracts.length} kontrak tercatat
        </p>
      </div>
    </div>
  )
}
