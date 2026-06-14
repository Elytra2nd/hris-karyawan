import { uploadEmployeePhoto } from '@/app/actions/upload';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-guard';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Mocking Next.js Cache (PENTING: Menghindari error Invariant)
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// 2. Mocking Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findUnique: vi.fn().mockResolvedValue({ id: 'emp_123', image: null }),
      update: vi.fn().mockResolvedValue({ id: 'emp_123' }),
    },
  },
}));

// 3. Mocking Auth Guard
vi.mock('@/lib/auth-guard', () => ({
  requirePermission: vi.fn(),
}));

// 4. Mocking Logger
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

// 5. Mocking fs/promises (Pola Partial Mock agar stabil)
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  const mockFns = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  };
  return { ...actual, ...mockFns, default: { ...actual, ...mockFns } };
});

describe('Upload Action (Employee Photo)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('harus menolak upload jika user tidak punya izin', async () => {
    (requirePermission as any).mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    );
    const formData = new FormData();

    const result = await uploadEmployeePhoto(formData, 'emp_123');

    expect(result.success).toBe(false);
    expect(result.message).toContain('izin');
  });

  it('harus berhasil memproses upload saat data valid', async () => {
    (requirePermission as any).mockResolvedValue({
      id: 'admin1',
      username: 'ilham_admin',
      role: 'ADMIN',
    });

    // Buat blob dengan JPEG magic bytes agar lolos sniffImageMime
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const mockFile = new File([jpegHeader], 'foto.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', mockFile);

    const result = await uploadEmployeePhoto(formData, 'emp_123');

    expect(result.success).toBe(true);
    expect(prisma.employee.update).toHaveBeenCalled();
  });

  it('harus error jika file kosong', async () => {
    (requirePermission as any).mockResolvedValue({ id: 'admin1', role: 'ADMIN' });
    const formData = new FormData();

    const result = await uploadEmployeePhoto(formData, 'emp_123');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Pilih file');
  });
});