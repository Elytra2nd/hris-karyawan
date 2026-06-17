import { describe, it, expect } from 'vitest';

// Simulasi fungsi validasi tanggal kontrak
function validateContractDates(start: Date, end: Date) {
  if (end < start) return { valid: false, error: 'Tanggal selesai tidak boleh sebelum tanggal mulai' };
  return { valid: true };
}

describe('Boundary & Logic Edge Cases', () => {
  it('harus menolak jika tanggal kontrak tidak logis (Back to the Future)', () => {
    const start = new Date('2026-04-21');
    const end = new Date('2025-04-21'); // Input salah (masa lalu)

    const result = validateContractDates(start, end);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Tanggal selesai tidak boleh sebelum tanggal mulai');
  });

  it('harus mengizinkan kontrak dengan durasi tepat 1 hari', () => {
    const start = new Date('2026-04-21');
    const end = new Date('2026-04-21');

    const result = validateContractDates(start, end);
    expect(result.valid).toBe(true);
  });
});