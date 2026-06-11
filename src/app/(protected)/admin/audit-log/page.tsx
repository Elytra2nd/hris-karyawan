import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/auth-guard'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  ClockCounterClockwiseIcon, PlusCircle, Pencil, Trash,
  Clock, PulseIcon, MagnifyingGlassMinusIcon,
} from '@phosphor-icons/react/ssr'
import { cn } from '@/lib/utils'
import { AuditFilters } from './audit-filters'

const PER_PAGE = 50

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>
}) {
  await requirePermission('audit_read')

  const { q = '', action: actionFilter = '', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr))

  const where = {
    AND: [
      q ? {
        OR: [
          { userName: { contains: q } },
          { entity: { contains: q } },
          { details: { contains: q } },
        ],
      } : {},
      actionFilter ? { action: actionFilter } : {},
    ],
  }

  const [logs, total, createCount, updateCount, deleteCount] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: PER_PAGE,
      skip: (page - 1) * PER_PAGE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, action: 'CREATE' } }),
    prisma.auditLog.count({ where: { ...where, action: 'UPDATE' } }),
    prisma.auditLog.count({ where: { ...where, action: 'DELETE' } }),
  ])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Log Aktivitas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Riwayat perubahan data sistem TMS
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={13} />
          {total} log ditemukan
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-primary rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-card/20 flex items-center justify-center shrink-0">
            <ClockCounterClockwiseIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{total}</p>
            <p className="text-xs text-blue-100 mt-1">Total Log</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <PlusCircle className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground leading-none">{createCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Dibuat</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground leading-none">{updateCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Diubah</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Trash className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-foreground leading-none">{deleteCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Dihapus</p>
          </div>
        </div>
      </div>

      {/* ─── Search + Filter ─── */}
      <AuditFilters q={q} actionFilter={actionFilter} />

      {/* ─── Table Desktop ─── */}
      <div className="hidden md:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-accent/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider w-36">Waktu</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Pengguna</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider w-28">Aksi</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Entitas</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <MagnifyingGlassMinusIcon size={32} className="mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-semibold text-muted-foreground">Tidak ada log ditemukan</p>
                    {(q || actionFilter) && (
                      <p className="text-xs text-muted-foreground mt-1">Coba ubah filter pencarian</p>
                    )}
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">
                      {format(new Date(log.createdAt), 'dd MMM yyyy', { locale: localeID })}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {format(new Date(log.createdAt), 'HH:mm:ss')}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                        {log.userName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground/80 capitalize">{log.entity}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {log.entityId.substring(0, 10)}…
                    </p>
                  </td>
                  <td className="px-5 py-3.5 max-w-[240px]">
                    <p className="text-xs text-muted-foreground truncate">{log.details || '—'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer + Pagination */}
        {total > 0 && (
          <div className="px-5 py-3 border-t border-border/60 bg-muted/50 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} dari {total} entri
            </p>
            {totalPages > 1 && (
              <AuditPagination page={page} totalPages={totalPages} q={q} actionFilter={actionFilter} />
            )}
          </div>
        )}
      </div>

      {/* ─── Mobile Card View ─── */}
      <div className="md:hidden bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <MagnifyingGlassMinusIcon size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm font-semibold text-muted-foreground">Tidak ada log ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                      {log.userName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{log.userName}</span>
                  </div>
                  <ActionBadge action={log.action} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  <span className="capitalize font-medium text-foreground/70">{log.entity}</span>
                  {log.details && <span className="ml-2">{log.details}</span>}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeID })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

/* ─── Action Badge ─── */
function ActionBadge({ action }: { action: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    CREATE: { label: 'Buat', className: 'bg-green-100 text-green-700', icon: <PlusCircle size={11} /> },
    UPDATE: { label: 'Ubah', className: 'bg-accent text-primary', icon: <Pencil size={11} /> },
    DELETE: { label: 'Hapus', className: 'bg-red-100 text-red-700', icon: <Trash size={11} /> },
  }
  const style = map[action] ?? { label: action, className: 'bg-muted text-foreground/70', icon: <PulseIcon size={11} /> }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', style.className)}>
      {style.icon}
      {style.label}
    </span>
  )
}

/* ─── Server-side pagination links ─── */
function AuditPagination({ page, totalPages, q, actionFilter }: {
  page: number; totalPages: number; q: string; actionFilter: string
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (actionFilter) params.set('action', actionFilter)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center gap-1">
      {page > 1 && (
        <a href={buildHref(page - 1)} className="px-2.5 py-1 text-xs rounded border border-border bg-card hover:bg-muted/50 transition-colors">‹</a>
      )}
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-2 text-xs text-muted-foreground">…</span>
        ) : (
          <a
            key={p}
            href={buildHref(p)}
            className={cn(
              'px-2.5 py-1 text-xs rounded border transition-colors',
              p === page
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'border-border bg-card hover:bg-muted/50'
            )}
          >
            {p}
          </a>
        )
      )}
      {page < totalPages && (
        <a href={buildHref(page + 1)} className="px-2.5 py-1 text-xs rounded border border-border bg-card hover:bg-muted/50 transition-colors">›</a>
      )}
    </div>
  )
}
