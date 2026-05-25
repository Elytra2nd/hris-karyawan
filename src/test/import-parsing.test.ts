import { describe, it, expect } from 'vitest'
import { parse, isValid, format } from 'date-fns'

// Mirrors parseDate logic in src/app/actions/import.ts — keep in sync
function parseDate(raw: string): string | null {
  if (!raw || raw === '-') return null
  const trimmed = raw.trim()

  const dotFmt = parse(trimmed, 'dd.MM.yyyy', new Date())
  if (isValid(dotFmt)) return format(dotFmt, 'yyyy-MM-dd')

  const slashFmt = parse(trimmed, 'dd/MM/yyyy', new Date())
  if (isValid(slashFmt)) return format(slashFmt, 'yyyy-MM-dd')

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  return null
}

describe('Import Excel — Parsing Tanggal', () => {
  it('harus parse format dd.MM.yyyy (format ekspor HRIS)', () => {
    expect(parseDate('01.07.2024')).toBe('2024-07-01')
  })

  it('harus parse format dd/MM/yyyy', () => {
    expect(parseDate('15/03/2023')).toBe('2023-03-15')
  })

  it('harus parse format ISO yyyy-MM-dd', () => {
    expect(parseDate('2024-12-25')).toBe('2024-12-25')
  })

  it('harus mengembalikan null untuk string kosong', () => {
    expect(parseDate('')).toBeNull()
  })

  it('harus mengembalikan null untuk "-"', () => {
    expect(parseDate('-')).toBeNull()
  })

  it('harus mengembalikan null untuk format tidak dikenal', () => {
    expect(parseDate('Jan 2024')).toBeNull()
  })

  it('harus mengembalikan null untuk angka random', () => {
    expect(parseDate('99999')).toBeNull()
  })
})

describe('Import Excel — Validasi Kolom', () => {
  const REQUIRED_COLS = ['BA', 'BA CABANG', 'CABANG', 'NAMA LENGKAP', 'NO KTP', 'TGL LAHIR', 'NAMA IBU', 'NO HP', 'FORM CONSENT', 'POSISI', 'TRAINEE SEJAK']

  it('baris lengkap tidak boleh ada kolom required yang kosong', () => {
    const row: Record<string, string> = {
      'BA': 'BA001',
      'BA CABANG': 'PT Astra Pontianak',
      'CABANG': 'H720',
      'NAMA LENGKAP': 'Budi Santoso',
      'NO KTP': '3271234567890001',
      'TGL LAHIR': '01.01.2000',
      'NAMA IBU': 'Siti',
      'NO HP': '08123456789',
      'FORM CONSENT': 'ADA',
      'POSISI': 'SALES EXECUTIVE',
      'TRAINEE SEJAK': '01.07.2024',
    }
    const missing = REQUIRED_COLS.filter(col => !row[col] || row[col] === '-')
    expect(missing).toHaveLength(0)
  })

  it('harus mendeteksi kolom yang kosong', () => {
    const row: Record<string, string> = { 'BA': 'BA001', 'NAMA LENGKAP': '' }
    const missing = REQUIRED_COLS.filter(col => !row[col] || row[col] === '-')
    expect(missing.length).toBeGreaterThan(0)
    expect(missing).toContain('NAMA LENGKAP')
  })
})
