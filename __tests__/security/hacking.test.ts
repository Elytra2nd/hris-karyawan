import { getEmployees } from '@/app/actions/employee';
import { uploadEmployeePhoto } from '@/app/actions/upload';
import { verifySession } from '@/lib/dal';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    employee: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn().mockImplementation((queries: Promise<unknown>[]) =>
      Promise.all(queries)
    ),
  },
}));

describe('Security & Hacking Defense Test', () => {
  it('harus kebal terhadap SQL Injection pada kolom Search', async () => {
    const maliciousInput = "'; DROP TABLE Employee; --";
    const result = await getEmployees({ search: maliciousInput });
    expect(Array.isArray(result.employees)).toBe(true);
  });

  it('harus menolak upload file berbahaya (Double Extension / Script)', async () => {
    (verifySession as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1',
      role: 'ADMIN',
      username: 'admin',
    });

    const maliciousFile = new Blob(['<script>alert("Hacked")</script>'], { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', maliciousFile, 'virus.php.pdf');

    const result = await uploadEmployeePhoto(formData, 'emp_123');

    expect(result.success).toBe(false);
    expect(result.message).toContain('Format foto tidak didukung');
  });

  it('harus menolak akses ke dokumen jika user tidak memiliki session (Broken Access Control)', async () => {
    (verifySession as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { code: 'UNAUTHORIZED' })
    );

    const formData = new FormData();
    const result = await uploadEmployeePhoto(formData, 'emp_123');
    expect(result.success).toBe(false);
  });
});
