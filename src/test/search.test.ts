import { describe, it, expect } from 'vitest';

// Simulasi data karyawan
const mockEmployees = [
  { namaLengkap: 'MUHAMMAD ILHAM', cabang: 'PONTIANAK', region: 'KALIMANTAN' },
  { namaLengkap: 'BUDI SANTOSO', cabang: 'SINTANG', region: 'KALIMANTAN' },
  { namaLengkap: 'SITI AMINAH', cabang: 'SAMPIT', region: 'KALIMANTAN' },
];

// Fungsi simulasi filter (sama seperti logika di Dashboard)
const filterEmployees = (query: string) => {
  const q = query.toLowerCase();
  return mockEmployees.filter(emp => 
    emp.namaLengkap.toLowerCase().includes(q) || 
    emp.cabang.toLowerCase().includes(q)
  );
};

describe('Fitur Pencarian & Filter Karyawan', () => {
  it('harus menemukan karyawan berdasarkan nama (Case Insensitive)', () => {
    const result = filterEmployees('ilham');
    expect(result).toHaveLength(1);
    expect(result[0].namaLengkap).toBe('MUHAMMAD ILHAM');
  });

  it('harus menemukan banyak karyawan berdasarkan nama cabang', () => {
    const result = filterEmployees('PONTIANAK');
    expect(result).toHaveLength(1);
    expect(result[0].cabang).toBe('PONTIANAK');
  });

  it('harus mengembalikan array kosong jika keyword tidak cocok', () => {
    const result = filterEmployees('JAKARTA');
    expect(result).toHaveLength(0);
  });
});