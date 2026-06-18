'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Bell, Clock, Warning, CaretRight, ArrowsClockwise,
  MagnifyingGlass, CheckCircle, Timer,
} from '@phosphor-icons/react'
import { Popover, PopoverTrigger, PopoverPopup } from '@/components/ui/popover'
import {
  getNotifications,
  type NotificationSummary,
  type ExpiringContract,
} from '@/app/actions/notifications'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

/* ─── Constants ─── */

const EMPTY: NotificationSummary = {
  expired: [], critical: [], warning: [], approaching: [], totalUnread: 0,
}

type Level = 'expired' | 'critical' | 'warning' | 'approaching'

const SECTION_META: Record<Level, {
  icon: typeof Warning
  label: string
  headerBg: string
  labelColor: string
}> = {
  expired: {
    icon: Timer,
    label: 'Kontrak Berakhir',
    headerBg: 'bg-red-100/80 dark:bg-red-950/30',
    labelColor: 'text-red-700 dark:text-red-400',
  },
  critical: {
    icon: Warning,
    label: 'Kritis (≤ 14 hari)',
    headerBg: 'bg-red-50 dark:bg-red-950/20',
    labelColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: Clock,
    label: 'Perlu Perhatian (15–30 hari)',
    headerBg: 'bg-amber-50 dark:bg-amber-950/20',
    labelColor: 'text-amber-600 dark:text-amber-400',
  },
  approaching: {
    icon: Clock,
    label: 'Mendekati (31–60 hari)',
    headerBg: 'bg-muted/50',
    labelColor: 'text-muted-foreground',
  },
}

const BADGE_COLOR: Record<Level, string> = {
  expired: 'text-white bg-red-600 dark:bg-red-700',
  critical: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40',
  warning: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40',
  approaching: 'text-muted-foreground bg-muted dark:bg-muted/60',
}

/* ─── Main component ─── */

export function NotificationBell() {
  const [data, setData] = useState<NotificationSummary>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())

  // Restore seen-state from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tms-notif-seen')
      if (stored) setSeenIds(new Set(JSON.parse(stored) as string[]))
    } catch { /* ignore */ }
  }, [])

  /* ── Fix #2: stable memoized allItems ── */
  const allItems = useMemo(
    () => [...data.expired, ...data.critical, ...data.warning, ...data.approaching],
    [data],
  )

  /* ── Fix #5: merge + cleanup seen IDs ── */
  const markAllRead = useCallback(() => {
    const currentIds = allItems.map(i => i.employeeId)
    setSeenIds(prev => {
      const merged = new Set([...prev, ...currentIds])
      // Only keep IDs that are still present in current notification data
      const cleaned = new Set([...merged].filter(id => currentIds.includes(id)))
      try { localStorage.setItem('tms-notif-seen', JSON.stringify([...cleaned])) } catch { /* ignore */ }
      return cleaned
    })
  }, [allItems])

  /* ── Fix #4: renamed from `fetch` to avoid shadowing window.fetch ── */
  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      setData(await getNotifications())
    } catch {
      // silent fail — notifications are non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  // Search also matches posisi
  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems
    const q = search.toLowerCase()
    return allItems.filter(i =>
      i.namaLengkap.toLowerCase().includes(q) ||
      i.cabang.toLowerCase().includes(q) ||
      i.posisi.toLowerCase().includes(q),
    )
  }, [allItems, search])

  const unseenCount = useMemo(
    () => allItems.filter(i => !seenIds.has(i.employeeId)).length,
    [allItems, seenIds],
  )
  const hasUrgent = unseenCount > 0

  /* ──────────────────────────────────────────────
   * Fix #1: Removed Tooltip wrapper — Radix Tooltip's
   * asChild doesn't compose with base-ui PopoverTrigger's
   * render prop. aria-label on the button handles a11y.
   * ────────────────────────────────────────────── */
  return (
    <Popover open={open} onOpenChange={v => { setOpen(v); if (v) loadNotifications() }}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              // WCAG 2.5.8 – min 36×36 touch target
              'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
              hasUrgent && 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30',
            )}
            aria-label={
              unseenCount > 0
                ? `${unseenCount} notifikasi kontrak baru`
                : 'Tidak ada notifikasi baru'
            }
            title="Notifikasi Kontrak"
          >
            <Bell size={18} aria-hidden="true" />
            {hasUrgent && (
              <span
                role="status"
                aria-live="polite"
                className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white px-1 ring-2 ring-background"
              >
                {unseenCount > 99 ? '99+' : unseenCount}
              </span>
            )}
          </button>
        }
      />

      {/* ── Fix #6: override Viewport's built-in py-4/px-4 ── */}
      <PopoverPopup
        className="w-[340px] p-0 overflow-hidden [&_[data-slot=popover-viewport]]:py-0 [&_[data-slot=popover-viewport]]:[--viewport-inline-padding:0px]"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground">Notifikasi</h2>
            {unseenCount > 0 && (
              <span
                className="text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-1.5 py-0.5 rounded-full"
                aria-label={`${unseenCount} notifikasi baru`}
              >
                {unseenCount} baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {allItems.length > 0 && unseenCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors rounded px-1.5 py-1 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Tandai semua notifikasi sudah dibaca"
              >
                <CheckCircle size={12} aria-hidden="true" />
                Baca semua
              </button>
            )}
            <button
              type="button"
              onClick={loadNotifications}
              className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground/80 transition-colors rounded px-1.5 py-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              disabled={loading}
              aria-label="Muat ulang notifikasi"
            >
              <ArrowsClockwise size={12} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        {/* ─── Search ─── */}
        {allItems.length > 3 && (
          <div className="px-3 py-2.5 border-b border-border/60">
            <div className="relative">
              <MagnifyingGlass
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, cabang, posisi…"
                aria-label="Cari notifikasi berdasarkan nama, cabang, atau posisi"
                className="w-full h-8 pl-8 pr-3 text-xs border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-shadow"
              />
            </div>
          </div>
        )}

        {/* ─── Body ─── */}
        <div
          className="max-h-80 overflow-y-auto"
          role="region"
          aria-label="Daftar notifikasi kontrak"
          aria-live="polite"
        >
          {loading && allItems.length === 0 ? (
            <div className="flex items-center justify-center py-14" role="status">
              <ArrowsClockwise size={16} className="animate-spin text-muted-foreground/50" aria-hidden="true" />
              <span className="sr-only">Memuat notifikasi…</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2.5 text-muted-foreground/60">
              <Bell size={28} className="opacity-30" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-wider">
                {search.trim() ? 'Tidak ada hasil pencarian' : 'Semua kontrak aman'}
              </p>
            </div>
          ) : (
            <>
              <NotifSection level="expired"     items={data.expired}     filteredItems={filteredItems} onClose={() => setOpen(false)} />
              <NotifSection level="critical"    items={data.critical}    filteredItems={filteredItems} onClose={() => setOpen(false)} />
              <NotifSection level="warning"     items={data.warning}     filteredItems={filteredItems} onClose={() => setOpen(false)} />
              <NotifSection level="approaching" items={data.approaching} filteredItems={filteredItems} onClose={() => setOpen(false)} />
            </>
          )}
        </div>

        {/* ─── Footer ─── */}
        {allItems.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/30">
            <Link
              href="/karyawan?filter=expiring90"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded py-0.5"
              aria-label="Lihat semua kontrak yang perlu tindakan di halaman karyawan"
            >
              Lihat semua kontrak perlu tindakan
              <CaretRight size={12} aria-hidden="true" />
            </Link>
          </div>
        )}
      </PopoverPopup>
    </Popover>
  )
}

/* ─── Section Component ─── */

function NotifSection({
  level,
  items,
  filteredItems,
  onClose,
}: {
  level: Level
  items: ExpiringContract[]
  filteredItems: ExpiringContract[]
  onClose: () => void
}) {
  const visible = items.filter(i => filteredItems.includes(i))
  if (visible.length === 0) return null

  const meta = SECTION_META[level]
  const Icon = meta.icon

  return (
    <section aria-label={`${meta.label} — ${visible.length} kontrak`}>
      {/* Sticky section header */}
      <div className={cn('px-4 py-2 sticky top-0 z-[1]', meta.headerBg)}>
        <span className={cn('text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5', meta.labelColor)}>
          <Icon size={12} aria-hidden="true" weight="bold" />
          {meta.label}
          <span className="font-semibold opacity-70">({visible.length})</span>
        </span>
      </div>

      {/* Items */}
      <ul className="divide-y divide-border/30" role="list">
        {visible.map(c => (
          <li key={c.id} role="listitem">
            <NotifRow item={c} level={level} onClick={onClose} />
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─── Row Component ─── */

function NotifRow({
  item,
  level,
  onClick,
}: {
  item: ExpiringContract
  level: Level
  onClick: () => void
}) {
  const daysText =
    item.daysLeft < 0  ? `${Math.abs(item.daysLeft)}h lalu` :
    item.daysLeft === 0 ? 'Hari ini' :
    `${item.daysLeft}h`

  const daysDescription =
    item.daysLeft < 0  ? `Kontrak berakhir ${Math.abs(item.daysLeft)} hari lalu` :
    item.daysLeft === 0 ? 'Kontrak berakhir hari ini' :
    `Kontrak berakhir dalam ${item.daysLeft} hari`

  return (
    <Link
      href={`/karyawan/${item.employeeId}`}
      onClick={onClick}
      aria-label={`${item.namaLengkap}, ${item.posisi} di ${item.cabang}. ${daysDescription}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors',
        'hover:bg-muted/50 dark:hover:bg-muted/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40',
      )}
    >
      {/* Days badge */}
      <span
        className={cn(
          'shrink-0 rounded-md px-2 py-1 text-xs font-black tabular-nums text-center min-w-[3rem]',
          BADGE_COLOR[level],
        )}
        aria-hidden="true"
      >
        {daysText}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground truncate leading-snug">
          {item.namaLengkap}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {item.posisi} · {item.cabang}
        </p>
        <p className="text-[11px] text-muted-foreground/60">
          {format(new Date(item.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
        </p>
      </div>

      {/* Arrow */}
      <CaretRight size={14} className="text-muted-foreground/40 shrink-0" aria-hidden="true" />
    </Link>
  )
}
