import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { describe, it, expect } from 'vitest';

describe('UI Localization (ID)', () => {
  it('harus memformat tanggal ke Bahasa Indonesia dengan benar', () => {
    const date = new Date('2026-04-21'); // Tanggal IT:Club kamu
    const formatted = format(date, 'dd MMMM yyyy', { locale: id });
    
    // Pastikan bukan "April" (Inggris) tapi "April" (Indonesia - kebetulan sama, tapi tes bulannya)
    const dateAgustus = new Date('2026-08-17');
    const formattedAgustus = format(dateAgustus, 'MMMM', { locale: id });
    
    expect(formatted).toBe('21 April 2026');
    expect(formattedAgustus).toBe('Agustus'); // Memastikan locale ID aktif
  });
});