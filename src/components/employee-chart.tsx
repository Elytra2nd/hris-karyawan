'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { ChartTooltip } from '@/components/chart-tooltip'

interface Props {
  data: [posisi: string, count: number][]
}

// Bar chart HORIZONTAL (layout vertical) — nama posisi di kiri kebaca penuh
// (tidak terpotong seperti versi vertikal), dan tinggi chart menyesuaikan jumlah
// baris sehingga card tidak menyisakan ruang kosong di bawah.
export function EmployeeChart({ data }: Props) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const chartData = data.map(([posisi, jumlah]) => ({ posisi, jumlah }))

  // A1: single Astra Blue — warna hanya encode "ini data", bukan dekorasi per-bar
  const barColor    = isDark ? '#60a5fa' : '#2563eb'
  const gridColor   = isDark ? '#334155' : '#e2e8f0'
  const tickColor   = isDark ? '#cbd5e1' : '#334155'
  const cursorColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.15)'

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Tidak ada data
      </div>
    )
  }

  // Tinggi self-size: tiap baris ~46px + padding atas/bawah.
  const height = chartData.length * 46 + 24

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 4, bottom: 4 }}
        style={{ cursor: 'pointer' }}
        barCategoryGap="22%"
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={gridColor} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="posisi"
          width={118}
          tick={{ fontSize: 12, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          interval={0}
        />
        <Tooltip
          cursor={{ fill: cursorColor }}
          content={<ChartTooltip valueSuffix=" orang" hint="Klik untuk filter" />}
        />
        <Bar
          dataKey="jumlah"
          name="Jumlah"
          radius={[0, 4, 4, 0]}
          maxBarSize={26}
          onClick={(_data, index) => {
            const posisi = chartData[index]?.posisi
            if (posisi) router.push(`/karyawan?posisi=${encodeURIComponent(posisi)}`)
          }}
        >
          {/* Direct label di ujung kanan tiap bar — nilai kebaca tanpa hover */}
          <LabelList
            dataKey="jumlah"
            position="right"
            style={{ fontSize: 12, fill: tickColor, fontWeight: 700 }}
          />
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={barColor}
              tabIndex={0}
              role="button"
              aria-label={`${entry.posisi}: ${entry.jumlah} orang - tekan Enter untuk filter`}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(`/karyawan?posisi=${encodeURIComponent(entry.posisi)}`)
                }
              }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
