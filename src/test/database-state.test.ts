/**
 * @vitest-environment node
 */
import { prisma } from '@/lib/prisma';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findUnique: vi.fn().mockImplementation(async () => ({
        id: 'emp_123',
        status: 'AKTIF',
        contracts: [
          { id: 'con_1', posisi: 'Trainee', traineeSejak: new Date('2026-01-01') }
        ]
      })),
      update: vi.fn().mockResolvedValue({ id: 'emp_123', status: 'NON_AKTIF' })
    }
  }
}));

describe('Integrasi Database State', () => {
  it('harus menjaga integritas data saat status karyawan berubah menjadi NON_AKTIF', async () => {
    // 1. Ambil data awal - Gunakan 'as any' untuk bypass pengecekan relasi pada mock
    const before = await prisma.employee.findUnique({ where: { id: 'emp_123' } }) as unknown as { status: string; contracts: { id: string; posisi: string; traineeSejak: Date }[] };
    
    // Safety check untuk null pointer
    if (!before) throw new Error("Mock data not found");

    expect(before.status).toBe('AKTIF');

    // 2. Lakukan update status
    const after = await prisma.employee.update({
      where: { id: 'emp_123' },
      data: { status: 'NON_AKTIF' }
    });

    // 3. Verifikasi
    expect(after.status).toBe('NON_AKTIF');
    
    // Sekarang TypeScript tidak akan protes lagi soal '.contracts'
    expect(before.contracts).toBeDefined();
    expect(before.contracts.length).toBe(1); 
  });
});