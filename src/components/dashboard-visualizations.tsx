'use client'

import { useMemo, useState } from 'react'
import { TrendUp, Buildings, ChartDonut } from '@phosphor-icons/react'
import { NativeSelect } from '@/components/ui/native-select'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ContractStatusChart } from '@/components/contract-status-chart'
import { EmployeeChart } from '@/components/employee-chart'
import { cn } from '@/lib/utils'

export interface VizItem {
  cabang: string   // kode cabang (H721…)
  posisi: string
  daysLeft: number // sisa hari kontrak terbaru
}

interface Props {
  data: VizItem[]
  branches: { code: string; label: string }[]
  positions: string[]
}

// Bucket status sesuai donut: aman >90, perhatian 31–90, kritis 0–30, expired <0.
function bucket(daysLeft: number): 'aman' | 'perhatian' | 'kritis' | 'expired' {
  if (daysLeft < 0) return 'expired'
  if (daysLeft <= 30) return 'kritis'
  if (daysLeft <= 90) return 'perhatian'
  return 'aman'
}

// ─── Kartu pembungkus seragam ─────────────────────────────────────────────────
function VizCard({
  title, subtitle, icon, iconBg, filter, children, className,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconBg: string
  filter: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden', className)}>
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/60">
        <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0', iconBg)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
        <div className="shrink-0">{filter}</div>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}

function MiniSelect({ value, onChange, children, label }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; label: string
}) {
  return (
    <NativeSelect
      aria-label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="h-8 text-xs max-w-[150px]"
    >
      {children}
    </NativeSelect>
  )
}

const SEG = [
  { key: 'aman', cls: 'bg-blue-700', label: 'Aman' },
  { key: 'perhatian', cls: 'bg-blue-500', label: 'Perlu Perhatian' },
  { key: 'kritis', cls: 'bg-blue-400', label: 'Kritis' },
  { key: 'expired', cls: 'bg-red-400', label: 'Expired' },
] as const

export function DashboardVisualizations({ data, branches, positions }: Props) {
  // Filter independen per visualisasi
  const [cabangStatus, setCabangStatus] = useState('')   // donut
  const [cabangPosisi, setCabangPosisi] = useState('')   // bar posisi
  const [posisiCabang, setPosisiCabang] = useState('')   // stacked cabang

  const labelByCode = useMemo(() => new Map(branches.map(b => [b.code, b.label])), [branches])

  // ── Donut: status kontrak (filter cabang) ──
  const statusCounts = useMemo(() => {
    const rows = cabangStatus ? data.filter(d => d.cabang === cabangStatus) : data
    const c = { aman: 0, perhatian: 0, kritis: 0, expired: 0 }
    for (const r of rows) c[bucket(r.daysLeft)]++
    return c
  }, [data, cabangStatus])

  // ── Bar: distribusi posisi (filter cabang) ──
  const posisiData = useMemo(() => {
    const rows = cabangPosisi ? data.filter(d => d.cabang === cabangPosisi) : data
    const m = new Map<string, number>()
    for (const r of rows) m.set(r.posisi, (m.get(r.posisi) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]) as [string, number][]
  }, [data, cabangPosisi])

  // ── Stacked: sebaran cabang (filter posisi) ──
  const cabangRows = useMemo(() => {
    const rows = posisiCabang ? data.filter(d => d.posisi === posisiCabang) : data
    const m = new Map<string, { aman: number; perhatian: number; kritis: number; expired: number; total: number }>()
    for (const r of rows) {
      const s = m.get(r.cabang) ?? { aman: 0, perhatian: 0, kritis: 0, expired: 0, total: 0 }
      s[bucket(r.daysLeft)]++
      s.total++
      m.set(r.cabang, s)
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total)
  }, [data, posisiCabang])

  const totalActive = data.length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

      {/* Status Kontrak (donut) */}
      <VizCard
        title="Status Kontrak"
        subtitle="Komposisi masa berlaku kontrak"
        icon={<ChartDonut className="h-4 w-4 text-primary" />}
        iconBg="bg-accent"
        filter={
          <MiniSelect label="Filter cabang" value={cabangStatus} onChange={setCabangStatus}>
            <option value="">Semua Cabang</option>
            {branches.map(b => <option key={b.code} value={b.code}>{b.code} · {b.label}</option>)}
          </MiniSelect>
        }
        className="h-[340px]"
      >
        <div className="h-full flex flex-col px-4 pt-3 pb-4">
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full">
              <ContractStatusChart
                safe={statusCounts.aman}
                warning={statusCounts.perhatian}
                critical={statusCounts.kritis}
                expired={statusCounts.expired}
                height={190}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-1">
            {SEG.map(s => (
              <span key={s.key} className="flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-sm', s.cls)} /> {s.label}
              </span>
            ))}
          </div>
        </div>
      </VizCard>

      {/* Distribusi Posisi (bar) */}
      <VizCard
        title="Distribusi Posisi"
        subtitle="Jumlah trainee per jabatan"
        icon={<TrendUp className="h-4 w-4 text-primary" />}
        iconBg="bg-accent"
        filter={
          <MiniSelect label="Filter cabang" value={cabangPosisi} onChange={setCabangPosisi}>
            <option value="">Semua Cabang</option>
            {branches.map(b => <option key={b.code} value={b.code}>{b.code} · {b.label}</option>)}
          </MiniSelect>
        }
        className="h-[340px]"
      >
        <div className="h-full px-3 py-3">
          {posisiData.length === 0
            ? <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Tidak ada data</div>
            : <EmployeeChart data={posisiData} height="100%" />}
        </div>
      </VizCard>

      {/* Sebaran per Cabang (stacked) — full width */}
      <VizCard
        title="Sebaran per Cabang"
        subtitle="Komposisi status kontrak tiap lokasi"
        icon={<Buildings className="h-4 w-4 text-green-600" />}
        iconBg="bg-green-50 dark:bg-green-950"
        filter={
          <MiniSelect label="Filter posisi" value={posisiCabang} onChange={setPosisiCabang}>
            <option value="">Semua Posisi</option>
            {positions.map(p => <option key={p} value={p}>{p}</option>)}
          </MiniSelect>
        }
        className="lg:col-span-2"
      >
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-2 border-b border-border/40 text-[11px] text-muted-foreground">
          {SEG.map(s => (
            <span key={s.key} className="flex items-center gap-1">
              <span className={cn('h-2 w-2 rounded-sm', s.cls)} /> {s.label}
            </span>
          ))}
        </div>
        <div className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
          {cabangRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 px-5">Tidak ada data</p>
          ) : cabangRows.map(([code, st]) => {
            const pct = totalActive > 0 ? Math.round((st.total / totalActive) * 100) : 0
            const total = st.total || 1
            const label = labelByCode.get(code)
            return (
              <div key={code} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex-1 min-w-0 truncate text-sm">
                    <span className="font-bold text-foreground font-mono">{code}</span>
                    {label && <span className="text-foreground/70 font-medium"> · {label}</span>}
                  </span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{st.total}</span>
                  <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">{pct}%</span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-muted overflow-hidden flex cursor-default">
                      {SEG.map(s => st[s.key] > 0 && (
                        <div key={s.key} className={s.cls} style={{ width: `${(st[s.key] / total) * 100}%` }} />
                      ))}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="flex-col items-stretch gap-1 px-3 py-2 min-w-[10rem] bg-popover text-popover-foreground border border-border shadow-md [&>svg]:fill-popover">
                    <p className="font-semibold text-foreground mb-0.5">{code}{label ? ` · ${label}` : ''}</p>
                    {SEG.map(s => (
                      <div key={s.key} className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-[3px]', s.cls)} />
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="ml-auto pl-3 font-mono tabular-nums text-foreground">{st[s.key]}</span>
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
      </VizCard>
    </div>
  )
}
