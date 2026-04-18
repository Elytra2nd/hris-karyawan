import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';

// Fungsi simulasi pembuat nomor surat di PDF
const generateDocNumber = (contractId: string) => {
  const shortId = contractId.substring(0, 8).toUpperCase();
  const year = format(new Date(), 'yyyy');
  return `${shortId}/HRD-MM/${year}`;
};

describe('Sistem Penomoran Dokumen PDF', () => {
  it('harus menghasilkan format nomor surat yang benar', () => {
    const mockId = 'cmnlk0inx000ubcqe';
    const expectedYear = new Date().getFullYear().toString();
    const result = generateDocNumber(mockId);
    
    // Ekspektasi: CMNLK0IN/HRD-MM/2026
    expect(result).toBe(`CMNLK0IN/HRD-MM/${expectedYear}`);
  });
});