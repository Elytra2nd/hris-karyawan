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
import { FieldError } from '@/components/ui/field-error'
import { Plus, CircleNotch, ShieldCheck, Shield } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createUserSchema, formDataToObject } from '@/lib/validation'

export function CreateUserModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const raw = formDataToObject(formData)

    // Client-side Zod validation
    const parsed = createUserSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach(e => {
        const field = e.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      toast.error('Ada isian yang belum sesuai - lihat kolom yang ditandai merah')
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) document.getElementById(String(firstField))?.focus()
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const result = await createUser(formData)
      if (result.success) {
        toast.success('Akun pengguna berhasil dibuat')
        setOpen(false)
        setErrors({})
      } else {
        // Surface server-side field errors if available
        if (result.fields) {
          setErrors(result.fields)
          const firstField = Object.keys(result.fields)[0]
          if (firstField) document.getElementById(firstField)?.focus()
        }
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba kirim ulang')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setErrors({}) }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 h-8 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-sm">
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

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="username" className="form-label">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              placeholder="Masukkan username..."
              required
              nativeInput
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
              className={`h-9 text-sm ${errors.username ? 'border-destructive' : ''}`}
              autoComplete="off"
            />
            <FieldError id="username-error" message={errors.username} />
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
              nativeInput
              placeholder="Min. 8 karakter"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
              className={`h-9 text-sm ${errors.password ? 'border-destructive' : ''}`}
              autoComplete="new-password"
            />
            <FieldError id="password-error" message={errors.password} />
            {!errors.password && (
              <p id="password-hint" className="text-xs text-muted-foreground/70">
                Min. 8 karakter, mengandung huruf kapital dan angka
              </p>
            )}
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
                    Admin - Akses penuh + manajemen user
                  </span>
                </SelectItem>
                <SelectItem value="HR_MANAGER">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-primary" />
                    HR Manager - CRUD karyawan + kontrak
                  </span>
                </SelectItem>
                <SelectItem value="HR_STAFF">
                  <span className="flex items-center gap-2">
                    <Shield size={12} className="text-green-600" />
                    HR Staff - Tambah & edit karyawan
                  </span>
                </SelectItem>
                <SelectItem value="VIEWER">
                  <span className="flex items-center gap-2">
                    <Shield size={12} className="text-muted-foreground" />
                    Pemirsa - Lihat saja
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t border-border/60">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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

