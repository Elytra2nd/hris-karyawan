/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from 'vitest';

// BYPASS server-only: Agar Vitest tidak dianggap sebagai Client Component
vi.mock('server-only', () => ({})); 

import { getEmployees } from '@/app/actions/employee';
import { prisma } from '@/lib/prisma';

// Mocking Prisma dengan Latency 10ms
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn().mockImplementation(async (promises) => Promise.all(promises)),
    employee: {
      findMany: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return Array.from({ length: 5 }, (_, i) => ({ id: `${i}`, namaLengkap: 'Karyawan' }));
      }),
      count: vi.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 5;
      }),
    },
  },
}));

describe('Performance & Load Test', () => {
  it('harus mampu menangani 50 permintaan konkuren tanpa bottleneck', async () => {
    const startTime = performance.now();
    
    const requests = Array.from({ length: 50 }, () => 
      getEmployees({ search: '', cabang: '', status: '' })
    );

    const results = await Promise.all(requests);
    const duration = performance.now() - startTime;

    console.log(`\n[LOAD TEST] 50 Parallel Requests: ${duration.toFixed(2)}ms`);

    expect(results.length).toBe(50);
    expect(duration).toBeLessThan(1000); 
  });
});