import { describe, it, expect } from 'vitest';

// Fungsi simulasi validasi input identitas
const validateIdentity = (nik: string, noKtp: string) => {
  if (noKtp.length !== 16 || !/^\d+$/.test(noKtp)) return "INVALID_KTP";
  if (nik && nik.length < 5) return "INVALID_NIK";
  return "VALID";
};

describe('Validasi Identitas Karyawan', () => {
  it('harus menolak No KTP yang bukan 16 digit angka', () => {
    expect(validateIdentity('123', '12345ABC')).toBe("INVALID_KTP");
    expect(validateIdentity('123', '123456789012345')).toBe("INVALID_KTP");
  });

  it('harus menerima No KTP 16 digit angka yang valid', () => {
    expect(validateIdentity('NIK123', '6171012345678901')).toBe("VALID");
  });

  it('harus membolehkan NIK kosong (untuk diisi HO nanti)', () => {
    expect(validateIdentity('', '6171012345678901')).toBe("VALID");
  });
});