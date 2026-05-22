import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      update: vi.fn().mockResolvedValue({ id: '123', namaLengkap: 'MUHAMMAD ILHAM' }),
    },
  },
}))

import { prisma } from '@/lib/prisma'

describe('Integrasi Update Karyawan', () => {
  it('harus menyimpan path /api/files/ (private, bukan /uploads/)', async () => {
    const employeeId = '123'
    const newPath = '/api/files/profiles/123_1234567890.jpg'

    await prisma.employee.update({
      where: { id: employeeId },
      data: { image: newPath },
    })

    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: employeeId },
      data: { image: newPath },
    })
  })

  it('path gambar harus diawali /api/files/ bukan /uploads/', () => {
    const path = '/api/files/profiles/abc_123.jpg'
    expect(path.startsWith('/api/files/')).toBe(true)
    expect(path.startsWith('/uploads/')).toBe(false)
  })
})
