'use client'

import { useState } from 'react'
import { createUser } from '@/app/actions/user'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, CircleNotch, ShieldCheck, Shield } from '@phosphor-icons/react'
import { toast } from 'sonner'

export function CreateUserModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    try {
      const result = await createUser(formData)
      if (result.success) {
        toast.success('Akun pengguna berhasil dibuat')
        setOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus — coba kirim ulang')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 h-8 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-md hover:bg-emerald-700 transition-colors shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-700">
          <Plus size={16} />
          Tambah Akun
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Tambah Pengguna Baru</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Buat akun untuk Admin atau Pemirsa sistem TMS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="username" className="form-label">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="Masukkan username..."
              required
              className="h-9 text-sm"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="form-label">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Min. 8 karakter"
              className="h-9 text-sm"
              autoComplete="new-password"
            />
            <p className="text-[11px] text-muted-foreground/70">
              Min. 8 karakter, mengandung huruf kapital dan angka
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="form-label">
              Role Akses
            </Label>
            <Select name="role" defaultValue="VIEWER">
              <SelectTrigger id="role" className="h-8 text-sm bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-amber-600" />
                    Admin — Akses penuh + manajemen user
                  </span>
                </SelectItem>
                <SelectItem value="HR_MANAGER">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-primary" />
                    HR Manager — CRUD karyawan + kontrak
                  </span>
                </SelectItem>
                <SelectItem value="HR_STAFF">
                  <span className="flex items-center gap-2">
                    <Shield size={12} className="text-green-600" />
                    HR Staff — Tambah & edit karyawan
                  </span>
                </SelectItem>
                <SelectItem value="VIEWER">
                  <span className="flex items-center gap-2">
                    <Shield size={12} className="text-muted-foreground" />
                    Pemirsa — Lihat saja
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t border-border/60">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><CircleNotch size={16} className="animate-spin" /> Menyimpan...</>
              ) : (
                'Simpan Akun'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
