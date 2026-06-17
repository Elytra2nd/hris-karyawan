'use client'

import { useState } from 'react'
import { deleteUser } from '@/app/actions/user'
import { Trash, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

export function DeleteUserButton({ id, username }: { id: string; username: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const result = await deleteUser(id)
      if (result.success) {
        toast.success(`Akun ${username} berhasil dihapus`)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <button
              disabled={loading}
              className="p-1.5 rounded-md text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loading
                ? <CircleNotch size={16} className="animate-spin" />
                : <Trash size={16} />}
            </button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">
          Hapus Akun
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus akun pengguna?</AlertDialogTitle>
          <AlertDialogDescription>
            Akun <strong>{username}</strong> akan dihapus permanen. Tindakan ini tidak dapat
            dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
