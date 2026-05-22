'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changeOwnPassword } from '@/app/actions/profile'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'

function PasswordInput({ id, name, label, placeholder }: { id: string; name: string; label: string; placeholder?: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="form-label">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          required
          placeholder={placeholder}
          nativeInput
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setPending(true)
    try {
      const result = await changeOwnPassword(formData)
      if (result.success) {
        toast.success(result.message ?? 'Password berhasil diubah')
        // Reset form
        const form = document.getElementById('change-pw-form') as HTMLFormElement
        form?.reset()
      } else {
        toast.error(result.error)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setPending(false)
    }
  }

  return (
    <form id="change-pw-form" action={handleSubmit} className="space-y-4">
      <PasswordInput id="currentPassword" name="currentPassword" label="Password Saat Ini" />
      <PasswordInput id="newPassword" name="newPassword" label="Password Baru" placeholder="Min. 8 karakter" />
      <PasswordInput id="confirmPassword" name="confirmPassword" label="Konfirmasi Password Baru" />

      <p className="text-[11px] text-slate-400">
        Password harus min. 8 karakter, mengandung huruf kapital dan angka.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 h-9 px-5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending
          ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
          : <><KeyRound size={14} /> Ubah Password</>}
      </button>
    </form>
  )
}
