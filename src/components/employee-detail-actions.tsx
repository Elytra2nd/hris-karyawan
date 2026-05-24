'use client'

import Link from 'next/link'
import { Pencil, PlusCircle } from '@phosphor-icons/react'
import { PrintButton } from '@/components/print-button'

interface EmployeeDetailActionsProps {
  id: string
  isAdmin: boolean
}

export function EmployeeDetailActions({ id, isAdmin }: EmployeeDetailActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <PrintButton />
      {isAdmin && (
        <>
          <Link href={`/karyawan/${id}/edit`}>
            <button className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              <Pencil size={14} />
              Edit Profil
            </button>
          </Link>
          <Link href={`/karyawan/${id}/kontrak`}>
            <button className="flex items-center gap-2 h-9 px-4 text-sm font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors shadow-sm">
              <PlusCircle size={14} />
              Kelola Kontrak
            </button>
          </Link>
        </>
      )}
    </div>
  )
}
