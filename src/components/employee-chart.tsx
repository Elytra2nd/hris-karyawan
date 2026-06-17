'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// Astra brand palette - aligned with desain.md chart tokens
const BAR_COLORS = ['#1d4ed8', '#0e7490', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed']
const BAR_COLORS_DARK = ['#3b82f6', '#22d3ee', '#4ade80', '#fbbf24', '#f87171', '#a78bfa']

interface Props {
  data: [posisi: string, count: number][]
}

export function EmployeeChart({ data }: Props) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const chartData = data.map(([posisi, jumlah]) => ({ posisi, jumlah }))
  const palette = isDark ? BAR_COLORS_DARK : BAR_COLORS
  const gridColor = isDark ? '#334155' : '#f1f5f9'
  const tickColor = isDark ? '#94a3b8' : '#94a3b8'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const cursorColor = isDark ? '#334155' : '#f1f5f9'

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Tidak ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="posisi"
          tick={{ fontSize: 12, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v.length > 7 ? v.slice(0, 7) + '…' : v}
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
          {chartData.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
