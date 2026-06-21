'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const PER_PAGE = 5

interface BranchRow {
  ba: string
  baCabang: string
  cabang: string
  count: number
}

export function BranchTable({
  data,
  totalEmployees,
}: {
  data: BranchRow[]
  totalEmployees: number
}) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(data.length / PER_PAGE)

  const rows = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return data.slice(start, start + PER_PAGE)
  }, [data, page])

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

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Integrasi Branch</h2>
            <p className="text-xs text-muted-foreground">Distribusi karyawan per kode cabang</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {data.length} cabang
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px]">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-5 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kode BA</th>
              <th className="px-5 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Cabang</th>
              <th className="px-5 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kode Cabang</th>
              <th className="px-5 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jumlah</th>
              <th className="px-5 py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proporsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((b, i) => {
              const pct = totalEmployees > 0 ? Math.round((b.count / totalEmployees) * 100) : 0
              return (
                <tr key={`${b.ba}-${b.cabang}-${i}`} className="hover:bg-muted/50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2 py-0.5 rounded bg-muted text-xs font-bold text-foreground font-mono">
                      {b.ba}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/karyawan?cabang=${b.cabang}`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0 group-hover:text-primary transition-colors" />
                      <span className="text-sm font-semibold">{b.cabang}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground/70 font-mono">{b.baCabang}</td>
                  <td className="px-5 py-3.5 text-center text-base font-bold text-foreground">{b.count}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground/70 w-7 text-right">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-2 border-t border-border/60 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, data.length)} dari{' '}
            <span className="font-semibold text-foreground/80">{data.length}</span> cabang
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Halaman sebelumnya"
            >
              <CaretLeft size={16} />
            </button>
            {pageNums.map((p, i) =>
              typeof p === 'number' ? (
                <button
                  key={i}
                  onClick={() => setPage(p)}
                  className={cn(
                    'h-8 w-8 flex items-center justify-center rounded-md text-xs font-semibold transition-colors',
                    page === p
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'border border-border bg-card hover:bg-muted/50 text-foreground/70'
                  )}
                >
                  {p}
                </button>
              ) : (
                <span key={i} className="h-8 w-8 flex items-center justify-center text-xs text-muted-foreground">
                  …
                </span>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Halaman berikutnya"
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
