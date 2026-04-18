import { describe, it, expect } from 'vitest';
import { differenceInMonths } from 'date-fns';

// Fungsi bantuan yang sama dengan yang ada di DetailKaryawanPage
const calculateAccumulatedWorkTime = (contracts: { traineeSejak: string, traineeSelesai: string }[]) => {
  const totalMonths = contracts.reduce((acc, curr) => {
    const start = new Date(curr.traineeSejak);
    const end = new Date(curr.traineeSelesai);
    return acc + differenceInMonths(end, start);
  }, 0);

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months };
};

describe('Kalkulasi Akumulasi Masa Kerja', () => {
  it('harus menghitung akumulasi bulan dengan benar dari beberapa kontrak', () => {
    const mockContracts = [
      { traineeSejak: '2023-01-01', traineeSelesai: '2023-04-01' }, // 3 bulan
      { traineeSejak: '2023-05-01', traineeSelesai: '2023-11-01' }, // 6 bulan
    ];

    const result = calculateAccumulatedWorkTime(mockContracts);
    expect(result.years).toBe(0);
    expect(result.months).toBe(9);
  });

  it('harus mengonversi 12 bulan menjadi 1 tahun', () => {
    const mockContracts = [
      { traineeSejak: '2023-01-01', traineeSelesai: '2023-07-01' }, // 6 bulan
      { traineeSejak: '2023-08-01', traineeSelesai: '2024-02-01' }, // 6 bulan
    ];

    const result = calculateAccumulatedWorkTime(mockContracts);
    expect(result.years).toBe(1);
    expect(result.months).toBe(0);
  });
});