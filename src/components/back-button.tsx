'use client'

import { useRouter } from 'next/navigation'
import { CaretLeft } from '@phosphor-icons/react'

export function BackButton({ fallbackHref, label = 'Kembali' }: { fallbackHref: string; label?: string }) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
    >
      <CaretLeft size={16} />
      {label}
    </button>
  )
}
