import { describe, it, expect } from 'vitest'
import { calculateEndDate, totalTenureMonths, splitTenure } from '@/lib/contract'

// Menguji rumus ASLI di src/lib/contract.ts — dipakai form input, action
// createEmployee/createContract, dan importer. Kalau rumusnya berubah,
// tanggal selesai di kontrak resmi trainee ikut berubah.
describe('Kontrak — tanggal selesai (inklusif)', () => {
  it('6 bulan dari 1 Juli 2025 berakhir 31 Desember 2025', () => {
    expect(calculateEndDate(new Date(2025, 6, 1), 6)).toEqual(new Date(2025, 11, 31))
  })

  it('3 bulan dari 1 Desember 2025 berakhir 28 Februari 2026 (lintas tahun)', () => {
    expect(calculateEndDate(new Date(2025, 11, 1), 3)).toEqual(new Date(2026, 1, 28))
  })

  it('menyesuaikan bulan pendek: 31 Januari + 1 bulan berakhir 27 Februari', () => {
    // addMonths menjepit ke 28 Feb, lalu mundur 1 hari.
    expect(calculateEndDate(new Date(2025, 0, 31), 1)).toEqual(new Date(2025, 1, 27))
  })

  it('tahun kabisat: 6 bulan dari 1 September 2027 berakhir 29 Februari 2028', () => {
    expect(calculateEndDate(new Date(2027, 8, 1), 6)).toEqual(new Date(2028, 1, 29))
  })
})

describe('Kontrak — akumulasi masa kerja', () => {
  const kontrak = [
    { traineeSejak: '2021-11-01', traineeSelesai: '2022-04-30' }, // 5 bln penuh
    { traineeSejak: '2022-05-01', traineeSelesai: '2022-10-31' },
    { traineeSejak: '2022-11-01', traineeSelesai: '2023-04-30' },
  ]

  it('menjumlahkan seluruh periode kontrak', () => {
    expect(totalTenureMonths(kontrak)).toBe(15)
  })

  it('trainee tanpa kontrak = 0 bulan', () => {
    expect(totalTenureMonths([])).toBe(0)
  })

  it('memecah total bulan jadi tahun + sisa bulan', () => {
    expect(splitTenure(15)).toEqual({ years: 1, months: 3 })
    expect(splitTenure(0)).toEqual({ years: 0, months: 0 })
    expect(splitTenure(24)).toEqual({ years: 2, months: 0 })
  })
})
