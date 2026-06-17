import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import { TrayIcon } from '@phosphor-icons/react/ssr'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: PhosphorIcon
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  asTableRow?: boolean
  colSpan?: number
  className?: string
}

export function EmptyState({
  icon: Icon = TrayIcon,
  title,
  description,
  action,
  asTableRow = false,
  colSpan,
  className,
}: EmptyStateProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-12 px-4 text-center', className)}>
      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
        <Icon size={20} className="text-muted-foreground/70" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground/80">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground max-w-[280px] mx-auto">{description}</p>
        )}
      </div>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-1 inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-1 inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )

  if (asTableRow) {
    return (
      <tr>
        <td colSpan={colSpan ?? 1}>{content}</td>
      </tr>
    )
  }

  return content
}
