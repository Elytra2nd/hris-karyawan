'use client'

import { useTheme } from 'next-themes'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface Props {
  safe: number
  warning: number
  critical: number
  expired: number
}

export function ContractStatusChart({ safe, warning, critical, expired }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const legendColor = isDark ? '#cbd5e1' : '#64748b'

  const data = [
    { name: 'Aman',      value: safe,     color: '#16a34a' },
    { name: 'Perhatian', value: warning,  color: '#f59e0b' },
    { name: 'Kritis',    value: critical, color: '#ef4444' },
    { name: 'Berakhir',  value: expired,  color: '#94a3b8' },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground font-bold uppercase tracking-wider">
        Tidak ada data kontrak
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} orang`]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 11, color: legendColor }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
