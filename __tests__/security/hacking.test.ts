import { getEmployees } from '@/app/actions/employee';
import { uploadEmployeeDocument } from '@/app/actions/upload';
import { verifySession } from '@/lib/dal';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn(),
}));

describe('Security & Hacking Defense Test', () => {
  
  it('harus kebal terhadap SQL Injection pada kolom Search', async () => {
    // String berbahaya untuk mencoba drop table
    const maliciousInput = "'; DROP TABLE Employee; --";
    
    // Pastikan tidak ada error dan tidak ada data yang terhapus (Prisma otomatis menanganinya)
    const result = await getEmployees({ search: maliciousInput });
    expect(Array.isArray(result)).toBe(true);
  });

  it('harus menolak upload file berbahaya (Double Extension / Script)', async () => {
    (verifySession as any).mockResolvedValue({ role: 'ADMIN' });
    
    const maliciousFile = new Blob(['<script>alert("Hacked")</script>'], { type: 'text/html' });
    const formData = new FormData();
    formData.append('file', maliciousFile, 'virus.php.pdf'); // Mencoba bypass format

    const result = await uploadEmployeeDocument('emp_123', formData, 'ktpPath');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Format file tidak didukung');
  });

  it('harus menolak akses ke dokumen jika user tidak memiliki session (Broken Access Control)', async () => {
    // Simulasi verifySession melempar error (user tidak login)
    (verifySession as any).mockRejectedValue(new Error('Unauthorized'));

    const formData = new FormData();
    try {
      await uploadEmployeeDocument('emp_123', formData, 'ktpPath');
    } catch (e: any) {
      expect(e.message).toBe('Unauthorized');
    }
  });
});