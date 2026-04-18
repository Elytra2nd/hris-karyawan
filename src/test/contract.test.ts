import { describe, it, expect } from 'vitest'
import { addMonths, format } from 'date-fns'

// Simulasi logika yang kita gunakan di EmployeeForm
function calculateEndDate(posisi: string, startDate: string) {
  const start = new Date(startDate)
  const monthsToAdd = posisi === 'ADMINISTRASI' ? 3 : 6
  const endDate = addMonths(start, monthsToAdd)
  return format(endDate, 'yyyy-MM-dd')
}

describe('Logika Bisnis Kontrak PT. Multi Makmur', () => {
  it('harus mengatur kontrak 3 bulan jika jabatan adalah ADMINISTRASI', () => {
    const tglMulai = '2024-01-01'
    const tglSelesai = calculateEndDate('ADMINISTRASI', tglMulai)
    
    // Ekspektasi: 2024-01-01 + 3 bulan = 2024-04-01
    expect(tglSelesai).toBe('2024-04-01')
  })

  it('harus mengatur kontrak 6 bulan untuk jabatan selain ADMINISTRASI (Contoh: SALESMAN)', () => {
    const tglMulai = '2024-01-01'
    const tglSelesai = calculateEndDate('SALESMAN', tglMulai)
    
    // Ekspektasi: 2024-01-01 + 6 bulan = 2024-07-01
    expect(tglSelesai).toBe('2024-07-01')
  })
})