'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Key, Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
import { adminResetPassword } from '@/app/actions/profile'
import { toast } from 'sonner'
import { z } from 'zod'

const resetPwSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Z]/, 'Harus mengandung minimal 1 huruf kapital')
  .regex(/[0-9]/, 'Harus mengandung minimal 1 angka')

export function ResetPasswordButton({ id, username }: { id: string; username: string }) {
  const [open, setOpen] = useState(false)
  const [show, setShow] = useState(false)
  const [pw, setPw] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    // Client-side Zod validation
    const parsed = resetPwSchema.safeParse(pw)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Password belum memenuhi persyaratan')
      document.getElementById('reset-pw-input')?.focus()
      return
    }

    setError('')
    setPending(true)
    try {
      const result = await adminResetPassword(id, pw)
      if (result.success) {
        toast.success(result.message ?? `Password ${username} direset`)
        setOpen(false)
        setPw('')
        setError('')
      } else {
        setError(result.error ?? 'Gagal mereset password')
        toast.error(result.error)
      }
    } catch (err: unknown) {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-4 text-xs font-semibold text-muted-foreground border border-border rounded-md hover:border-primary/30 hover:text-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
        title="Reset password"
      >
        <Key size={12} /> Reset Password
      </button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setPw(''); setShow(false); setError('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key size={16} className="text-primary" /> Reset Password
            </DialogTitle>
            <DialogDescription>
              Atur password baru untuk akun <strong>{username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reset-pw-input" className="form-label">
                Password Baru <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="reset-pw-input"
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={e => { setPw(e.target.value); if (error) setError('') }}
                  placeholder="Min. 8 karakter"
                  nativeInput
                  aria-invalid={!!error}
                  aria-describedby={error ? 'reset-pw-error' : 'reset-pw-hint'}
                  className={`pr-9 ${error ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/80"
                >
                  {show ? <EyeSlash size={12} /> : <Eye size={12} />}
                </button>
              </div>
              <FieldError id="reset-pw-error" message={error} />
              {!error && (
                <p id="reset-pw-hint" className="text-xs text-muted-foreground/70">
                  Min. 8 karakter, huruf kapital, dan angka
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleReset} disabled={pending || !pw.trim()} className="gap-2">
              {pending
                ? <><CircleNotch size={12} className="animate-spin" /> Menyimpan...</>
                : <><Key size={12} /> Reset</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

