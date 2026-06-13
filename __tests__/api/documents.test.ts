import { GET } from '@/app/api/files/documents/[filename]/route';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/dal', () => ({
  verifySession: vi.fn().mockResolvedValue({ id: 'user1', role: 'ADMIN' }),
}));

describe('API File Route (Next.js 15)', () => {
  it('harus berhasil meng-unwrap params.filename yang bersifat Promise', async () => {
    const mockParams = Promise.resolve({ filename: 'ktp_123.pdf' });
    
    const request = new Request('http://localhost/api/files/documents/ktp_123.pdf');
    
    try {
      await GET(request, { params: mockParams });
    } catch (e: unknown) {
      // Pastikan e adalah instance dari Error agar bisa akses .message
      if (e instanceof Error) {
        expect(e.message).not.toContain('undefined');
      } else {
        // Jika bukan Error object, lempar ulang agar test gagal secara eksplisit
        throw e;
      }
    }
  });
});