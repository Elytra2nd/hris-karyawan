import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  ClockCounterClockwiseIcon, PlusCircle, Pencil, Trash,
  Clock, PulseIcon, MagnifyingGlassMinusIcon,
} from '@phosphor-icons/react/ssr'
import { cn } from '@/lib/utils'

export default async function AuditLogPage() {
  await verifySession()

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const createCount = logs.filter(l => l.action === 'CREATE').length
  const updateCount = logs.filter(l => l.action === 'UPDATE').length
  const deleteCount = logs.filter(l => l.action === 'DELETE').length

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Aktivitas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Riwayat perubahan data sistem HRIS
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={13} />
          Menampilkan {logs.length} log terakhir
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-primary rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <ClockCounterClockwiseIcon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white leading-none">{logs.length}</p>
            <p className="text-[11px] text-blue-100 mt-1">Total Log</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <PlusCircle className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{createCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Dibuat</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Pencil className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{updateCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Diubah</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <Trash className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 leading-none">{deleteCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Dihapus</p>
          </div>
        </div>
      </div>

      {/* ─── Table Desktop ─── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-200 bg-blue-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                  Waktu
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-28">
                  Aksi
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Entitas
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <MagnifyingGlassMinusIcon size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-semibold text-gray-500">Belum ada log aktivitas</p>
                  </td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  {/* Waktu */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800">
                      {format(new Date(log.createdAt), 'dd MMM yyyy', { locale: localeID })}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {format(new Date(log.createdAt), 'HH:mm:ss')}
                    </p>
                  </td>

                  {/* User */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                        {log.userName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                    </div>
                  </td>

                  {/* Badge aksi */}
                  <td className="px-5 py-3.5 text-center">
                    <ActionBadge action={log.action} />
                  </td>

                  {/* Entity */}
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-700 capitalize">{log.entity}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {log.entityId.substring(0, 10)}…
                    </p>
                  </td>

                  {/* Detail */}
                  <td className="px-5 py-3.5 max-w-[240px]">
                    <p className="text-xs text-muted-foreground truncate">
                      {log.details || '—'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-muted-foreground">
              {logs.length} entri ditampilkan · Data diurutkan terbaru ke terlama
            </p>
          </div>
        )}
      </div>

      {/* ─── Mobile Card View ─── */}
      <div className="md:hidden bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <MagnifyingGlassMinusIcon size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-500">Belum ada log aktivitas</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-50 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                      {log.userName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                  </div>
                  <ActionBadge action={log.action} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  <span className="capitalize font-medium text-gray-600">{log.entity}</span>
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
    CREATE: {
      label: 'Buat',
      className: 'bg-green-100 text-green-700',
      icon: <PlusCircle size={11} />,
    },
    UPDATE: {
      label: 'Ubah',
      className: 'bg-blue-100 text-blue-700',
      icon: <Pencil size={11} />,
    },
    DELETE: {
      label: 'Hapus',
      className: 'bg-red-100 text-red-700',
      icon: <Trash size={11} />,
    },
  }
  const style = map[action] ?? {
    label: action,
    className: 'bg-gray-100 text-gray-600',
    icon: <PulseIcon size={11} />,
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
      style.className
    )}>
      {style.icon}
      {style.label}
    </span>
  )
}
