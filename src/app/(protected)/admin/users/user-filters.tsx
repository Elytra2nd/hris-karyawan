'use client'

import { useRouter, usePathname } from 'next/navigation'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useCallback } from 'react'
import { NativeSelect } from '@/components/ui/native-select'

const ROLE_OPTIONS = [
  { value: '', label: 'Semua Role' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'HR_STAFF', label: 'HR Staff' },
  { value: 'VIEWER', label: 'Pemirsa' },
]

export function UserFilters({ q, role }: { q: string; role: string }) {
  const router = useRouter()
  const pathname = usePathname()

  const push = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { q, role, ...updates }
    if (merged.q) params.set('q', merged.q)
    if (merged.role) params.set('role', merged.role)
    router.push(`${pathname}?${params.toString()}`)
  }, [q, role, pathname, router])

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1 max-w-sm">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
        <input
          defaultValue={q}
          onChange={e => push({ q: e.target.value })}
          placeholder="Cari username..."
          aria-label="Cari pengguna"
          className="w-full h-8 pl-9 pr-8 text-base sm:text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
        />
        {q && (
          <button onClick={() => push({ q: '' })} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70">
            <X size={16} />
          </button>
        )}
      </div>
      <NativeSelect
        value={role}
        onChange={e => push({ role: e.target.value })}
        aria-label="Filter role pengguna"
      >
        {ROLE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </NativeSelect>
    </div>
  )
}
