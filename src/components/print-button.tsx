'use client'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Printer } from '@phosphor-icons/react'

interface PrintButtonProps {
  label?: string
  className?: string
}

export function PrintButton({ label = 'Cetak', className = '' }: PrintButtonProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className={`h-9 gap-2 text-foreground/80 ${className}`}
        >
          <Printer size={16} />
          {label}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        Cetak atau simpan sebagai PDF
      </TooltipContent>
    </Tooltip>
  )
}
