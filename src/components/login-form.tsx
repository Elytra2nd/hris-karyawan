'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import {
  CircleNotch, Lock, User, Eye, EyeSlash,
  WarningCircle, ArrowRight, Shield,
} from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginForm() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    try {
      const res = await signIn('credentials', { redirect: false, username, password })

      if (res?.error) {
        setError('Username atau password salah')
        setLoading(false)
      } else if (res?.ok) {
        window.location.replace('/')
      }
    } catch {
      setError('Koneksi terputus — coba login ulang')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">

      {/* ─── Heading ─── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Masuk ke Sistem
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Trainee Monitoring System — Astra Motor Kalbar
        </p>
      </div>

      {/* ─── Form ─── */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="form-label">Username</Label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Masukkan username"
              required
              disabled={loading}
              autoComplete="username"
              className="pl-9 h-10 text-base sm:text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="form-label">Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              required
              disabled={loading}
              autoComplete="current-password"
              className="pl-9 pr-10 h-10 text-base sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700">
            <WarningCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <><CircleNotch size={16} className="animate-spin" /> Memverifikasi...</>
          ) : (
            <>Masuk <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      {/* ─── Security note ─── */}
      <div className="mt-8 pt-6 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground/60">
        <span className="flex items-center gap-2">
          <Lock size={12} />
          Koneksi terenkripsi · Sesi aman
        </span>
        <span className="flex items-center gap-1">
          <Shield size={12} />
          TMS v2.1
        </span>
      </div>
    </div>
  )
}
