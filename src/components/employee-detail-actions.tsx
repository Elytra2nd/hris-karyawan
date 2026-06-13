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
            <button className="flex items-center gap-2 h-8 px-4 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800 dark:hover:bg-amber-900">
              <Pencil size={16} />
              Edit Profil
            </button>
          </Link>
          <Link href={`/karyawan/${id}/kontrak`}>
            <button className="flex items-center gap-2 h-8 px-4 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-700">
              <PlusCircle size={16} />
              Kelola Kontrak
            </button>
          </Link>
        </>
      )}
    </div>
  )
}
