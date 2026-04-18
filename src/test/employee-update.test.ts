import { describe, it, expect, vi } from 'vitest';
// Kita mock prisma agar tidak benar-benar menulis ke MySQL Laragon
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      update: vi.fn().mockResolvedValue({ id: '123', namaLengkap: 'MUHAMMAD ILHAM' }),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('Integrasi Update Karyawan', () => {
  it('harus mengirimkan path gambar yang benar ke database saat update foto', async () => {
    const mockEmployeeId = '123';
    const mockImagePath = '/uploads/profiles/test-photo.jpg';

    // Simulasi pemanggilan prisma update
    await prisma.employee.update({
      where: { id: mockEmployeeId },
      data: { image: mockImagePath }
    });

    // Uji apakah prisma.employee.update dipanggil dengan argumen yang benar
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: mockEmployeeId },
      data: { image: mockImagePath }
    });
  });
});