'use client'

import { useRouter, usePathname } from 'next/navigation'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useCallback } from 'react'

const ACTION_OPTIONS = [
  { value: '', label: 'Semua Aksi' },
  { value: 'CREATE', label: 'Dibuat' },
  { value: 'UPDATE', label: 'Diubah' },
  { value: 'DELETE', label: 'Dihapus' },
]

export function AuditFilters({ q, actionFilter }: { q: string; actionFilter: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const push = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { q, action: actionFilter, ...updates }
    if (merged.q) params.set('q', merged.q)
    if (merged.action) params.set('action', merged.action)
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }, [q, actionFilter, pathname, router])

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
        <input
          defaultValue={q}
          onChange={e => push({ q: e.target.value })}
          placeholder="Cari pengguna, entitas, detail..."
          className="w-full h-9 pl-9 pr-8 text-base sm:text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
        />
        {q && (
          <button
            onClick={() => push({ q: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Action filter */}
      <select
        value={actionFilter}
        onChange={e => push({ action: e.target.value })}
        className="h-9 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-foreground"
      >
        {ACTION_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
