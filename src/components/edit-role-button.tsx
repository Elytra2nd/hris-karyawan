'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PencilSimple, Shield, CircleNotch } from '@phosphor-icons/react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { updateUserRole } from '@/app/actions/user'
import { toast } from 'sonner'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin', desc: 'Akses penuh ke seluruh sistem' },
  { value: 'HR_MANAGER', label: 'HR Manager', desc: 'CRUD karyawan & kontrak' },
  { value: 'HR_STAFF', label: 'HR Staff', desc: 'Tambah & edit karyawan' },
  { value: 'VIEWER', label: 'Pemirsa', desc: 'Hanya lihat data' },
]

export function EditRoleButton({ id, username, currentRole }: { id: string; username: string; currentRole: string }) {
  const [open, setOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRole)
  const [pending, setPending] = useState(false)

  const handleSave = async () => {
    if (selectedRole === currentRole) {
      setOpen(false)
      return
    }

    setPending(true)
    try {
      const result = await updateUserRole(id, selectedRole)
      if (result.success) {
        toast.success(result.message ?? `Role ${username} diubah`)
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => { setSelectedRole(currentRole); setOpen(true) }}
            className="p-1.5 rounded-md text-muted-foreground/70 hover:text-amber-600 hover:bg-amber-50 transition-colors dark:hover:bg-amber-950 dark:hover:text-amber-400"
            aria-label="Ubah role"
          >
            <PencilSimple size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Ubah Role</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setSelectedRole(currentRole) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Ubah Role
            </DialogTitle>
            <DialogDescription>
              Pilih role baru untuk akun <strong>{username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="form-label">Role</Label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedRole === opt.value
                      ? 'border-primary bg-accent ring-1 ring-primary/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={selectedRole === opt.value}
                    onChange={() => setSelectedRole(opt.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={pending || selectedRole === currentRole}
              className="gap-2"
            >
              {pending
                ? <><CircleNotch size={12} className="animate-spin" /> Menyimpan...</>
                : <><Shield size={12} /> Simpan</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
