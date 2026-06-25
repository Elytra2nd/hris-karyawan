'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'

interface Props {
  data: [posisi: string, count: number][]
}

export function EmployeeChart({ data }: Props) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const chartData = data.map(([posisi, jumlah]) => ({ posisi, jumlah }))

  // A1: single Astra Blue — warna hanya encode "ini data", bukan dekorasi per-bar
  const barColor     = isDark ? '#3b82f6' : '#1d4ed8'
  const gridColor    = isDark ? '#334155' : '#e2e8f0'  // B4: slate-200 (tetap mundur)
  const tickColor    = isDark ? '#94a3b8' : '#475569'  // B3: slate-600 (lebih gelap)
  const tooltipBg    = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const cursorColor  = isDark ? '#334155' : '#f1f5f9'

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Tidak ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <BarChart
        data={chartData}
        margin={{ top: 22, right: 4, left: -20, bottom: 0 }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="posisi"
          tick={{ fontSize: 12, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v.length > 9 ? v.slice(0, 9) + '…' : v}
        />
        <YAxis
          tick={{ fontSize: 12, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [`${value} orang`, 'Jumlah']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg }}
          cursor={{ fill: cursorColor }}
          labelFormatter={(label) => `${label} - klik untuk filter`}
        />
        <Bar
          dataKey="jumlah"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
          onClick={(_data, index) => {
            const posisi = chartData[index]?.posisi
            if (posisi) router.push(`/karyawan?posisi=${encodeURIComponent(posisi)}`)
          }}
        >
          {/* C3: direct label di atas tiap bar — tidak perlu hover untuk baca nilai */}
          <LabelList
            dataKey="jumlah"
            position="top"
            style={{ fontSize: 11, fill: tickColor, fontWeight: 700 }}
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
