'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field-error'
import { changeOwnPassword } from '@/app/actions/profile'
import { changePasswordSchema } from '@/lib/validation'
import { toast } from 'sonner'
import { Eye, EyeSlash, CircleNotch, Key } from '@phosphor-icons/react'

function PasswordInput({
  id, name, label, placeholder, error,
}: {
  id: string; name: string; label: string; placeholder?: string; error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="form-label">
        {label} <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          required
          placeholder={placeholder}
          nativeInput
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`pr-9 ${error ? 'border-destructive' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/80 transition-colors"
        >
          {show ? <EyeSlash size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (formData: FormData) => {
    // Client-side Zod validation
    const raw = {
      currentPassword: formData.get('currentPassword')?.toString() ?? '',
      newPassword: formData.get('newPassword')?.toString() ?? '',
      confirmPassword: formData.get('confirmPassword')?.toString() ?? '',
    }

    const parsed = changePasswordSchema.safeParse(raw)
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
    setPending(true)
    try {
      // Kirim sebagai plain object (menghindari OpenLiteSpeed multipart bug)
      const result = await changeOwnPassword(raw)
      if (result.success) {
        toast.success(result.message ?? 'Password berhasil diubah')
        const form = document.getElementById('change-pw-form') as HTMLFormElement
        form?.reset()
        setErrors({})
      } else {
        // Surface server-side field errors (e.g. "Password saat ini tidak sesuai")
        if (result.fields) {
          setErrors(result.fields)
          const firstField = Object.keys(result.fields)[0]
          if (firstField) document.getElementById(firstField)?.focus()
        }
        toast.error(result.error)
      }
    } catch (err: unknown) {
      toast.error('Koneksi terputus - coba simpan ulang')
    } finally {
      setPending(false)
    }
  }

  return (
    <form id="change-pw-form" action={handleSubmit} noValidate className="space-y-4">
      <PasswordInput id="currentPassword" name="currentPassword" label="Password Saat Ini" error={errors.currentPassword} />
      <PasswordInput id="newPassword" name="newPassword" label="Password Baru" placeholder="Min. 8 karakter" error={errors.newPassword} />
      <PasswordInput id="confirmPassword" name="confirmPassword" label="Konfirmasi Password Baru" error={errors.confirmPassword} />

      {!errors.newPassword && (
        <p className="text-xs text-muted-foreground/70">
          Password harus min. 8 karakter, mengandung huruf kapital dan angka.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 h-8 px-6 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending
          ? <><CircleNotch size={16} className="animate-spin" /> Menyimpan...</>
          : <><Key size={16} /> Ubah Password</>}
      </button>
    </form>
  )
}

