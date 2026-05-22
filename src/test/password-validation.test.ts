import { describe, it, expect } from 'vitest'
import { createUserSchema } from '@/lib/validation'

describe('Validasi Password Pengguna', () => {
  const valid = { username: 'admin_test', role: 'ADMIN' as const }

  it('harus menolak password kurang dari 8 karakter', () => {
    const r = createUserSchema.safeParse({ ...valid, password: 'Abc1234' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toContain('8')
  })

  it('harus menolak password tanpa huruf kapital', () => {
    const r = createUserSchema.safeParse({ ...valid, password: 'password1' })
    expect(r.success).toBe(false)
  })

  it('harus menolak password tanpa angka', () => {
    const r = createUserSchema.safeParse({ ...valid, password: 'PasswordOnly' })
    expect(r.success).toBe(false)
  })

  it('harus menerima password yang memenuhi semua syarat', () => {
    const r = createUserSchema.safeParse({ ...valid, password: 'Password1' })
    expect(r.success).toBe(true)
  })

  it('harus menerima password kompleks dengan simbol', () => {
    const r = createUserSchema.safeParse({ ...valid, password: 'P@ssw0rd!123' })
    expect(r.success).toBe(true)
  })

  it('harus menolak username dengan karakter khusus', () => {
    const r = createUserSchema.safeParse({ ...valid, username: 'admin@test', password: 'Password1' })
    expect(r.success).toBe(false)
  })

  it('harus menolak role yang tidak valid', () => {
    const r = createUserSchema.safeParse({ ...valid, password: 'Password1', role: 'SUPERUSER' })
    expect(r.success).toBe(false)
  })
})
