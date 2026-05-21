'use client'

import { useState } from 'react'
import { deleteUser } from '@/app/actions/user'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function DeleteUserButton({ id, username }: { id: string; username: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const result = await deleteUser(id)
      if (result.success) {
        toast.success(`Akun ${username} berhasil dihapus`)
      } else {
        toast.error(result.error || 'Gagal menghapus akun')
      }
    } catch {
      toast.error('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={loading}
          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          aria-label={`Hapus akun ${username}`}
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <Trash2 size={15} />}
        </button>
      </AlertDialogTrigger>
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
