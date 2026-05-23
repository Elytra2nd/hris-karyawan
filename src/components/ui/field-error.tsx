import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldErrorProps {
  message?: string
  className?: string
  /** id of the input — used for aria-describedby pairing */
  id?: string
}

export function FieldError({ message, className, id }: FieldErrorProps) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      className={cn('flex items-start gap-1 text-[11px] text-red-600 font-medium mt-0.5', className)}
    >
      <AlertCircle size={11} className="shrink-0 mt-px" />
      <span>{message}</span>
    </p>
  )
}
