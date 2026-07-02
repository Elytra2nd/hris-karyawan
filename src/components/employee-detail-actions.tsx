'use client'

import Link from 'next/link'
import { Pencil, PlusCircle, Printer, DotsThreeVertical } from '@phosphor-icons/react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EmployeeDetailActionsProps {
  id: string
  isAdmin: boolean
}

export function EmployeeDetailActions({ id, isAdmin }: EmployeeDetailActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Aksi trainee"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <DotsThreeVertical size={20} weight="bold" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Delay agar menu tertutup dulu sebelum dialog print muncul */}
        <DropdownMenuItem
          onSelect={() => setTimeout(() => window.print(), 100)}
          className="cursor-pointer"
        >
          <Printer size={16} className="mr-2" /> Cetak
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/karyawan/${id}/edit`}>
                <Pencil size={16} className="mr-2" /> Edit Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href={`/karyawan/${id}/kontrak`}>
                <PlusCircle size={16} className="mr-2" /> Kelola Kontrak
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
