import { describe, it, expect } from 'vitest';

// Fungsi simulasi validasi di Server Action
const validateUpload = (fileType: string, fileSize: number) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(fileType)) return "INVALID_TYPE";
  if (fileSize > maxSize) return "TOO_LARGE";
  return "OK";
};

describe('Validasi Keamanan Upload Foto', () => {
  it('harus menolak file selain gambar (contoh: PDF)', () => {
    const result = validateUpload('application/pdf', 500000);
    expect(result).toBe("INVALID_TYPE");
  });

  it('harus menolak file gambar yang melebihi 5MB', () => {
    const result = validateUpload('image/jpeg', 6 * 1024 * 1024);
    expect(result).toBe("TOO_LARGE");
  });

  it('harus menerima file gambar JPG/PNG di bawah 5MB', () => {
    const result = validateUpload('image/png', 2 * 1024 * 1024);
    expect(result).toBe("OK");
  });
});