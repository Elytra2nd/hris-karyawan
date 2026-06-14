'use client'

import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react'

export function BackButton({ fallbackHref, label = 'Kembali' }: { fallbackHref: string; label?: string }) {
  return (
    <Link
      href={fallbackHref}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
    >
      <CaretLeft size={16} />
      {label}
    </Link>
  )
}
