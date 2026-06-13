'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changeOwnPassword } from '@/app/actions/profile'
import { toast } from 'sonner'
import { Eye, EyeSlash, CircleNotch, Key } from '@phosphor-icons/react'

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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
        >
          {show ? <EyeSlash size={16} /> : <Eye size={16} />}
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
      toast.error('Koneksi terputus — coba simpan ulang')
    } finally {
      setPending(false)
    }
  }

  return (
    <form id="change-pw-form" action={handleSubmit} className="space-y-4">
      <PasswordInput id="currentPassword" name="currentPassword" label="Password Saat Ini" />
      <PasswordInput id="newPassword" name="newPassword" label="Password Baru" placeholder="Min. 8 karakter" />
      <PasswordInput id="confirmPassword" name="confirmPassword" label="Konfirmasi Password Baru" />

      <p className="text-[11px] text-muted-foreground/70">
        Password harus min. 8 karakter, mengandung huruf kapital dan angka.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 h-8 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending
          ? <><CircleNotch size={16} className="animate-spin" /> Menyimpan...</>
          : <><Key size={16} /> Ubah Password</>}
      </button>
    </form>
  )
}
