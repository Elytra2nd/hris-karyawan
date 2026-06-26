'use client'

import * as React from 'react'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Class untuk elemen <select> itu sendiri */
  className?: string
  /** Class untuk wrapper (mis. w-full, w-fit) */
  containerClassName?: string
}

/**
 * Select native dengan chevron custom + styling seragam.
 * Dipakai untuk filter sederhana (tanpa search). Untuk dropdown
 * ber-search/ber-hint gunakan <SelectCombobox />.
 */
export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect({ className, containerClassName, children, ...props }, ref) {
    return (
      <div className={cn('relative inline-flex items-center', containerClassName)}>
        <select
          ref={ref}
          className={cn(
            'h-8 w-full cursor-pointer appearance-none rounded-md border border-border bg-card pl-3 pr-8 text-base text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <CaretDown
          size={14}
          weight="bold"
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    )
  },
)
