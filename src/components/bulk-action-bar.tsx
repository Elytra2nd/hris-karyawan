'use client'

import { useState } from 'react'
import { Archive, UserCheck, UserMinus, X, CircleNotch } from '@phosphor-icons/react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Busy = 'archive' | 'aktif' | 'nonaktif' | null

export function BulkActionBar({
  count,
  canEdit,
  canDelete,
  busy,
  onSetActive,
  onSetInactive,
  onArchive,
  onClear,
}: {
  count: number
  canEdit: boolean
  canDelete: boolean
  busy: Busy
  onSetActive: () => void
  onSetInactive: () => void
  onArchive: () => void
  onClear: () => void
}) {
  const [confirmArchive, setConfirmArchive] = useState(false)
  const isBusy = busy !== null

  if (count === 0) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 pointer-events-none sm:bottom-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg shadow-black/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClear}
              aria-label="Batalkan pilihan"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {count} trainee dipilih
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={onSetActive}
                  disabled={isBusy}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground/80 hover:bg-muted disabled:opacity-50"
                >
                  {busy === 'aktif' ? <CircleNotch size={15} className="animate-spin" /> : <UserCheck size={15} className="text-emerald-600" />}
                  Set Aktif
                </button>
                <button
                  onClick={onSetInactive}
                  disabled={isBusy}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground/80 hover:bg-muted disabled:opacity-50"
                >
                  {busy === 'nonaktif' ? <CircleNotch size={15} className="animate-spin" /> : <UserMinus size={15} className="text-amber-600" />}
                  Set Non-Aktif
                </button>
              </>
            )}
            {canDelete && (
              <button
                onClick={() => setConfirmArchive(true)}
                disabled={isBusy}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-sm font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/40"
              >
                {busy === 'archive' ? <CircleNotch size={15} className="animate-spin" /> : <Archive size={15} />}
                Arsipkan
              </button>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan {count} trainee?</AlertDialogTitle>
            <AlertDialogDescription>
              {count} data terpilih akan dipindahkan ke Arsip beserta riwayat kontraknya. Data tidak hilang dan bisa dipulihkan kapan saja dari halaman Arsip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onArchive(); setConfirmArchive(false) }}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Ya, Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
