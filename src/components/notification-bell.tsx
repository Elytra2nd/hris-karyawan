'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Warning, CaretRight, ArrowsClockwise } from '@phosphor-icons/react'
import { Popover, PopoverTrigger, PopoverPopup } from '@/components/ui/popover'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { getNotifications, type NotificationSummary } from '@/app/actions/notifications'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

const EMPTY: NotificationSummary = { critical: [], warning: [], approaching: [], totalUnread: 0 }

export function NotificationBell() {
  const [data, setData] = useState<NotificationSummary>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetch = async () => {
    setLoading(true)
    try {
      const result = await getNotifications()
      setData(result)
    } catch {
      // silent fail — notification is non-critical
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, [])

  const allItems = [...data.critical, ...data.warning, ...data.approaching]
  const hasUrgent = data.totalUnread > 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Popover open={open} onOpenChange={v => { setOpen(v); if (v) fetch() }}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  hasUrgent && 'text-red-600 hover:bg-red-50'
                )}
                aria-label={`${data.totalUnread} notifikasi`}
              >
                <Bell size={16} />
                {hasUrgent && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
                    {data.totalUnread > 9 ? '9+' : data.totalUnread}
                  </span>
                )}
              </button>
            }
          />

      <PopoverPopup className="w-80 p-0 overflow-hidden" side="bottom" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-sm font-bold text-foreground">Notifikasi Kontrak</span>
          <button
            onClick={fetch}
            className="flex items-center gap-1 text-[11px] text-muted-foreground/70 hover:text-foreground/80 transition-colors"
            disabled={loading}
          >
            <ArrowsClockwise size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Body */}
        <div className="max-h-80 overflow-y-auto">
          {loading && allItems.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <ArrowsClockwise size={16} className="animate-spin text-muted-foreground/50" />
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground/70">
              <Bell size={24} className="opacity-30" />
              <p className="text-xs font-bold uppercase tracking-wider">Semua kontrak aman</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {/* Critical section */}
              {data.critical.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-red-50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
                      <Warning size={10} /> Kritis (≤ 14 hari)
                    </span>
                  </div>
                  {data.critical.map(c => <NotifRow key={c.id} item={c} level="critical" onClick={() => setOpen(false)} />)}
                </>
              )}
              {/* Warning section */}
              {data.warning.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-amber-50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                      <Clock size={10} /> Perlu Perhatian (15–30 hari)
                    </span>
                  </div>
                  {data.warning.map(c => <NotifRow key={c.id} item={c} level="warning" onClick={() => setOpen(false)} />)}
                </>
              )}
              {/* Approaching section */}
              {data.approaching.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-muted/50">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock size={10} /> Mendekati (31–60 hari)
                    </span>
                  </div>
                  {data.approaching.map(c => <NotifRow key={c.id} item={c} level="approaching" onClick={() => setOpen(false)} />)}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {allItems.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/60">
            <Link
              href="/karyawan"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Lihat semua karyawan <CaretRight size={13} />
            </Link>
          </div>
        )}
      </PopoverPopup>
        </Popover>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Notifikasi Kontrak
      </TooltipContent>
    </Tooltip>
  )
}

function NotifRow({
  item,
  level,
  onClick,
}: {
  item: { employeeId: string; namaLengkap: string; cabang: string; posisi: string; traineeSelesai: string; daysLeft: number }
  level: 'critical' | 'warning' | 'approaching'
  onClick: () => void
}) {
  const color = {
    critical: 'text-red-600 bg-red-100',
    warning: 'text-amber-600 bg-amber-100',
    approaching: 'text-muted-foreground bg-muted',
  }[level]

  return (
    <Link
      href={`/karyawan/${item.employeeId}`}
      onClick={onClick}
      className="flex items-start gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
    >
      <span className={cn('mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black', color)}>
        {item.daysLeft}h
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{item.namaLengkap}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {item.posisi} · {item.cabang}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
          {format(new Date(item.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}
        </p>
      </div>
      <CaretRight size={13} className="text-muted-foreground/50 mt-1 shrink-0" />
    </Link>
  )
}
