'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const BAR_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']

interface Props {
  data: [posisi: string, count: number][]
}

export function EmployeeChart({ data }: Props) {
  const chartData = data.map(([posisi, jumlah]) => ({ posisi, jumlah }))

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400 font-bold uppercase tracking-wider">
        Tidak ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="posisi"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => v.length > 7 ? v.slice(0, 7) + '…' : v}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [`${value} orang`, 'Jumlah']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          cursor={{ fill: '#f8fafc' }}
        />
        <Bar dataKey="jumlah" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
