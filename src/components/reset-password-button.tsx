'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Key, Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
import { adminResetPassword } from '@/app/actions/profile'
import { toast } from 'sonner'

export function ResetPasswordButton({ id, username }: { id: string; username: string }) {
  const [open, setOpen] = useState(false)
  const [show, setShow] = useState(false)
  const [pw, setPw] = useState('')
  const [pending, setPending] = useState(false)

  const handleReset = async () => {
    if (!pw.trim()) return
    setPending(true)
    try {
      const result = await adminResetPassword(id, pw)
      if (result.success) {
        toast.success(result.message ?? `Password ${username} direset`)
        setOpen(false)
        setPw('')
      } else {
        toast.error(result.error)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mereset password')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-semibold text-slate-500 border border-slate-200 rounded-md hover:border-primary/30 hover:text-primary hover:bg-blue-50 transition-colors"
        title="Reset password"
      >
        <Key size={11} /> Reset PW
      </button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setPw(''); setShow(false) } }}>
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
              <Label className="form-label">Password Baru</Label>
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Min. 8 karakter"
                  nativeInput
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {show ? <EyeSlash size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Min. 8 karakter, huruf kapital, dan angka</p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="sm" onClick={handleReset} disabled={pending || pw.length < 8} className="gap-1.5">
              {pending
                ? <><CircleNotch size={13} className="animate-spin" /> Menyimpan...</>
                : <><Key size={13} /> Reset</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
