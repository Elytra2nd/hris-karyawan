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
        setError('Username atau password salah. Silakan coba lagi.')
        setLoading(false)
      } else if (res?.ok) {
        window.location.replace('/')
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">

      {/* ─── Branding ─── */}
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/astra-logo.png"
          alt="Astra Motor Kalimantan Barat"
          className="h-12 object-contain mx-auto mb-5"
        />
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          HRIS Karyawan
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Astra Motor Kalimantan Barat
        </p>
      </div>

      {/* ─── Card ─── */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Accent bar — biru Astra */}
        <div className="h-1 bg-primary w-full" />

        <div className="px-7 pt-7 pb-8">
          <div className="mb-6 text-center">
            <h2 className="text-base font-semibold text-foreground">Masuk ke Sistem</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Masukkan kredensial akun Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="form-label">Username</Label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Masukkan username"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="form-label">Password</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pl-9 pr-10 h-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-foreground/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeSlash size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-700">
                <WarningCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2"
            >
              {loading ? (
                <><CircleNotch size={15} className="animate-spin" /> Memverifikasi...</>
              ) : (
                <>Masuk <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
            <Lock size={10} />
            Koneksi terenkripsi · Sesi aman
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between mt-5 px-1 text-xs text-muted-foreground/70">
        <span>© 2026 Astra Motor Kalimantan Barat</span>
        <span className="flex items-center gap-1">
          <Shield size={10} />
          HRIS v2.1
        </span>
      </div>
    </div>
  )
}
