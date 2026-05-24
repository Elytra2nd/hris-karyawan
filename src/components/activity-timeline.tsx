import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import {
  PlusCircle,
  Pencil,
  Trash,
  Clock,
} from '@phosphor-icons/react/ssr'
import { cn } from '@/lib/utils'

interface ActivityTimelineProps {
  employeeId: string
}

export async function ActivityTimeline({ employeeId }: ActivityTimelineProps) {
  const logs = await prisma.auditLog.findMany({
    where: { entityId: employeeId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Clock size={24} className="opacity-30" />
        <p className="text-sm font-bold uppercase tracking-wider">Belum ada aktivitas</p>
      </div>
    )
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <PlusCircle size={16} className="text-green-600" />
      case 'UPDATE':
        return <Pencil size={16} className="text-blue-600" />
      case 'DELETE':
        return <Trash size={16} className="text-red-600" />
      default:
        return <Clock size={16} className="text-gray-400" />
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Dibuat'
      case 'UPDATE':
        return 'Diubah'
      case 'DELETE':
        return 'Dihapus'
      default:
        return action
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-50 border-green-200'
      case 'UPDATE':
        return 'bg-blue-50 border-blue-200'
      case 'DELETE':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => (
        <div key={log.id} className="relative flex gap-4">
          {/* Timeline line */}
          {index < logs.length - 1 && (
            <div className="absolute left-[23px] top-12 w-0.5 h-12 bg-gray-200" />
          )}

          {/* Icon */}
          <div className="relative flex-shrink-0 mt-1">
            <div className={cn(
              'h-12 w-12 rounded-full border-2 flex items-center justify-center',
              getActionColor(log.action)
            )}>
              {getActionIcon(log.action)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 py-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {getActionLabel(log.action)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  oleh {log.userName}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: localeID })}
              </p>
            </div>

            {/* Details */}
            {log.details && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                {log.details}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
