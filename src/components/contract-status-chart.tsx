'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from '@/components/chart-tooltip'

// Opsi B: status aktif (aman/perhatian/kritis) pakai ramp biru-monokrom agar
// bersih; HANYA "Berakhir" yang merah-muted supaya sinyal bahaya tetap kebaca.
const SEGMENT_COLORS = {
  light: { aman: '#1d4ed8', perhatian: '#3b82f6', kritis: '#60a5fa', berakhir: '#f87171' },
  dark:  { aman: '#93c5fd', perhatian: '#60a5fa', kritis: '#3b82f6', berakhir: '#f87171' },
}

const FILTER_MAP: Record<string, string> = {
  'Aman':      '/karyawan?status=AKTIF',
  'Perhatian': '/karyawan?filter=expiring90',
  'Kritis':    '/karyawan?filter=expiring30',
  'Berakhir':  '/karyawan?filter=expired',
}

interface Props {
  safe: number
  warning: number
  critical: number
  expired: number
  /** Tinggi area donut. Default 200. */
  height?: number
}

export function ContractStatusChart({ safe, warning, critical, expired, height = 200 }: Props) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const c = isDark ? SEGMENT_COLORS.dark : SEGMENT_COLORS.light

  // C1: total untuk ditampilkan di lubang donut
  const total = safe + warning + critical + expired

  const data = [
    { name: 'Aman',      value: safe,     color: c.aman },
    { name: 'Perhatian', value: warning,  color: c.perhatian },
    { name: 'Kritis',    value: critical, color: c.kritis },
    { name: 'Berakhir',  value: expired,  color: c.berakhir },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Tidak ada data kontrak
      </div>
    )
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        {/* C2: Legend dihapus — SummaryRow di bawah sudah berisi info yang sama persis */}
        <PieChart style={{ cursor: 'pointer' }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            onClick={(entry: { name?: string }) => router.push(FILTER_MAP[entry.name ?? ''] ?? '/karyawan')}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                tabIndex={0}
                role="button"
                aria-label={`${entry.name}: ${entry.value} orang - tekan Enter untuk filter`}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    router.push(FILTER_MAP[entry.name] ?? '/karyawan')
                  }
                }}
              />
            ))}
          </Pie>
          <Tooltip
            cursor={false}
            content={<ChartTooltip valueSuffix=" orang" hint="Klik segmen untuk filter" />}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* C1: angka total di lubang donut ("show the whole in the hole") */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-foreground tabular-nums">{total}</span>
        <span className="text-xs text-muted-foreground">kontrak</span>
      </div>
    </div>
  )
}
