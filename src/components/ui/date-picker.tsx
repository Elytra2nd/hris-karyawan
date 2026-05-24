'use client'

import * as React from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverTrigger, PopoverPopup } from '@/components/ui/popover'
import { CalendarIcon } from '@phosphor-icons/react'
import { format, parse, isValid } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: string  // ISO yyyy-MM-dd
  onValueChange?: (value: string) => void
  name?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  className?: string
  minDate?: Date
  maxDate?: Date
}

function toDate(iso?: string): Date | undefined {
  if (!iso) return undefined
  const d = parse(iso, 'yyyy-MM-dd', new Date())
  return isValid(d) ? d : undefined
}

export function DatePicker({
  value,
  onValueChange,
  name,
  id,
  placeholder = 'Pilih tanggal',
  required,
  disabled,
  readOnly,
  className,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [internal, setInternal] = React.useState(value ?? '')
  const current = value ?? internal
  const selected = toDate(current)
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    const iso = format(date, 'yyyy-MM-dd')
    setInternal(iso)
    onValueChange?.(iso)
    setOpen(false)
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled || readOnly}
          render={
            <button
              type="button"
              id={id}
              className={cn(
                'h-9 w-full inline-flex items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-xs/5 outline-none transition-colors',
                'hover:bg-accent/40 data-[popup-open]:border-ring focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/24',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                readOnly && 'bg-blue-50/50 text-primary font-semibold cursor-not-allowed',
                !current && 'text-muted-foreground',
                className
              )}
            >
              <span className="truncate">
                {selected ? format(selected, 'EEEE, dd MMM yyyy', { locale: localeID }) : placeholder}
              </span>
              <CalendarIcon size={14} className="opacity-60 shrink-0" />
            </button>
          }
        />
        <PopoverPopup className="p-3">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={localeID}
            disabled={(date: Date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            captionLayout="dropdown"
          />
        </PopoverPopup>
      </Popover>

      {name && (
        <input type="hidden" name={name} value={current} required={required} />
      )}
    </>
  )
}
