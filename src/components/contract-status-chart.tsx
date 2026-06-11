'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

// Semantic colors: Aman=green, Perhatian=amber, Kritis=red, Berakhir=slate
const SEGMENT_COLORS = {
  light: { aman: '#16a34a', perhatian: '#d97706', kritis: '#dc2626', berakhir: '#475569' },
  dark:  { aman: '#4ade80', perhatian: '#fbbf24', kritis: '#f87171', berakhir: '#94a3b8' },
}

// Map segment name → karyawan filter URL
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
}

export function ContractStatusChart({ safe, warning, critical, expired }: Props) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const c = isDark ? SEGMENT_COLORS.dark : SEGMENT_COLORS.light
  const tooltipBg = isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0'
  const legendColor = isDark ? '#cbd5e1' : '#64748b'

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
    <ResponsiveContainer width="100%" height={220}>
      <PieChart style={{ cursor: 'pointer' }}>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          dataKey="value"
          onClick={(entry: { name?: string }) => router.push(FILTER_MAP[entry.name ?? ''] ?? '/karyawan')}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} orang`, `${name} — klik untuk filter`]}
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
