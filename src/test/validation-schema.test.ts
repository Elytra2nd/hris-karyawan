import { describe, it, expect } from 'vitest'
import { createEmployeeSchema, updateEmployeeSchema, createContractSchema } from '@/lib/validation'

const validEmployee = {
  ba: 'BA001',
  baCabang: 'PT Astra Motor Pontianak',
  cabang: 'H720' as const,
  namaLengkap: 'Budi Santoso',
  noKtp: '3271234567890001',
  tglLahir: '2000-01-15',
  namaIbu: 'Siti Rahayu',
  noHp: '081234567890',
  formConsent: 'ADA' as const,
  posisi: 'SALES EXECUTIVE' as const,
  traineeSejak: '2024-07-01',
}

describe('Schema Validasi Karyawan - createEmployeeSchema', () => {
  it('harus menerima data lengkap yang valid', () => {
    expect(createEmployeeSchema.safeParse(validEmployee).success).toBe(true)
  })

  it('harus menolak No KTP bukan 16 digit', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, noKtp: '12345' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toContain('16')
  })

  it('harus menolak No KTP dengan huruf', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, noKtp: '327123456789000A' })
    expect(r.success).toBe(false)
  })

  it('harus menolak No HP yang tidak diawali 08', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, noHp: '62812345678' })
    expect(r.success).toBe(false)
  })

  it('harus menolak No HP terlalu pendek', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, noHp: '081234' })
    expect(r.success).toBe(false)
  })

  it('harus menerima NIK kosong (null)', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, nik: null })
    expect(r.success).toBe(true)
  })

  it('harus menolak cabang yang kosong', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, cabang: '' })
    expect(r.success).toBe(false)
  })

  // Posisi kini string dinamis (divalidasi ke tabel Position di server),
  // jadi schema hanya mewajibkan tidak kosong - bukan enum statis.
  it('harus menolak posisi yang kosong', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, posisi: '' })
    expect(r.success).toBe(false)
  })

  it('harus menerima posisi kustom non-kosong (divalidasi ke DB di server)', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, posisi: 'DIREKTUR' })
    expect(r.success).toBe(true)
  })

  it('harus menolak tanggal trainee tidak valid', () => {
    const r = createEmployeeSchema.safeParse({ ...validEmployee, traineeSejak: 'bukan-tanggal' })
    expect(r.success).toBe(false)
  })
})

describe('Schema Validasi Karyawan - updateEmployeeSchema', () => {
  it('harus memiliki field status yang wajib', () => {
    const updateData = { ...validEmployee, status: 'AKTIF' as const }
    delete (updateData as Partial<typeof updateData>).posisi
    delete (updateData as Partial<typeof updateData>).traineeSejak
    expect(updateEmployeeSchema.safeParse(updateData).success).toBe(true)
  })

  it('harus menolak status yang tidak valid', () => {
    const updateData = { ...validEmployee, status: 'CUTI' }
    const r = updateEmployeeSchema.safeParse(updateData)
    expect(r.success).toBe(false)
  })
})

describe('Schema Validasi Kontrak - createContractSchema', () => {
  it('harus menerima kontrak valid', () => {
    const r = createContractSchema.safeParse({ posisi: 'ADMINISTRATOR', traineeSejak: '2024-07-01' })
    expect(r.success).toBe(true)
  })

  it('harus menolak posisi yang kosong', () => {
    const r = createContractSchema.safeParse({ posisi: '', traineeSejak: '2024-07-01' })
    expect(r.success).toBe(false)
  })
})
