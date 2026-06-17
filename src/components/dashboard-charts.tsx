'use client'

import dynamic from 'next/dynamic'

// Lazy-load Recharts (±100KB) off the dashboard's critical path. ssr:false is valid
// here because this is a Client Component; the charts also depend on resolvedTheme
// (next-themes) and the DOM, so client-only rendering avoids hydration mismatch.
const chartSkeleton = () => <div className="h-[220px] animate-pulse rounded-lg bg-muted" />

export const ContractStatusChart = dynamic(
  () => import('@/components/contract-status-chart').then(m => ({ default: m.ContractStatusChart })),
  { ssr: false, loading: chartSkeleton }
)

export const EmployeeChart = dynamic(
  () => import('@/components/employee-chart').then(m => ({ default: m.EmployeeChart })),
  { ssr: false, loading: chartSkeleton }
)
