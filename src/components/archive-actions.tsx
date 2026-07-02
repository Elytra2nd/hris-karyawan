'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowCounterClockwise, Trash, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { restoreEmployee, permanentlyDeleteEmployee } from '@/app/actions/employee'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ArchiveActions({
  id,
  name,
  canHardDelete,
}: {
  id: string
  name: string
  canHardDelete: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<'restore' | 'delete' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleRestore = async () => {
    setBusy('restore')
    try {
      const r = await restoreEmployee(id)
      if (r.success) {
        toast.success(`${name} berhasil dipulihkan`)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setBusy(null)
    }
  }

  const handleHardDelete = async () => {
    setBusy('delete')
    try {
      const r = await permanentlyDeleteEmployee(id)
      if (r.success) {
        toast.success(`${name} dihapus permanen`)
        router.refresh()
      } else {
        toast.error(r.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setBusy(null)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRestore}
        disabled={busy !== null}
        className="h-9"
      >
        {busy === 'restore'
          ? <CircleNotch size={14} className="animate-spin" />
          : <ArrowCounterClockwise size={14} />}
        <span className="ml-1.5">Pulihkan</span>
      </Button>

      {canHardDelete && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={busy !== null}
            className="h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            aria-label={`Hapus permanen ${name}`}
          >
            <Trash size={14} />
          </Button>

          <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus permanen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Data <strong>{name}</strong> beserta seluruh riwayat kontrak akan dihapus permanen dari database dan <strong>tidak dapat dipulihkan</strong>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleHardDelete}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Ya, Hapus Permanen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}
