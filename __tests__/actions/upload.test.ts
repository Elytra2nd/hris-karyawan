import { uploadEmployeeDocument } from '@/app/actions/upload';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { createAuditLog } from '@/lib/audit';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mocking Next.js Cache (PENTING: Menghindari error Invariant)
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// 2. Mocking Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: { 
    employee: { 
      update: vi.fn().mockResolvedValue({ id: 'emp_123' }) 
    } 
  },
}));

// 3. Mocking Auth Session
vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn(),
}));

// 4. Mocking Audit Log
vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
}));

// 5. Mocking fs/promises (Pola Partial Mock agar stabil)
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  const mockFns = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
  return { ...actual, ...mockFns, default: { ...actual, ...mockFns } };
});

describe('Upload Action (Digital Archiving)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('harus menolak upload jika user bukan ADMIN', async () => {
    (verifySession as any).mockResolvedValue({ id: 'user2', role: 'VIEWER' });
    const formData = new FormData();
    
    const result = await uploadEmployeeDocument('emp_123', formData, 'ktpPath');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Hanya Admin');
  });

  it('harus berhasil memproses upload saat data valid', async () => {
    (verifySession as any).mockResolvedValue({ 
      id: 'admin1', 
      username: 'ilham_admin', 
      role: 'ADMIN' 
    });
    
    // Gunakan Blob untuk simulasi file yang valid
    const mockFile = new Blob(['content'], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', mockFile, 'ktp.pdf');

    const result = await uploadEmployeeDocument('emp_123', formData, 'ktpPath');

    // Cek keberhasilan
    expect(result.success).toBe(true);
    expect(prisma.employee.update).toHaveBeenCalled();
    expect(createAuditLog).toHaveBeenCalledWith(
      'admin1', 
      'ilham_admin', 
      'UPLOAD', 
      'employee_document', 
      'emp_123', 
      expect.any(Object)
    );
  });

  it('harus error jika file kosong', async () => {
    (verifySession as any).mockResolvedValue({ id: 'admin1', role: 'ADMIN' });
    const formData = new FormData(); 
    
    const result = await uploadEmployeeDocument('emp_123', formData, 'ktpPath');

    expect(result.success).toBe(false);
    expect(result.error).toContain('tidak ditemukan');
  });
});