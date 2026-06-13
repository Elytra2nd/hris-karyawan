import { differenceInMonths } from 'date-fns';
import { describe, it, expect } from 'vitest';

// Simulasi fungsi yang ada di employee-table atau detail page
const calculateAccumulatedTenure = (contracts: { start: Date, end: Date }[]) => {
  return contracts.reduce((total, contract) => {
    return total + differenceInMonths(contract.end, contract.start);
  }, 0);
};

describe('Tenure Utility Logic', () => {
  it('harus menghitung akumulasi bulan dengan benar dari beberapa kontrak', () => {
    const contracts = [
      { start: new Date('2023-01-01'), end: new Date('2023-07-01') }, // 6 Bulan
      { start: new Date('2024-01-01'), end: new Date('2024-07-01') }, // 6 Bulan
    ];
    
    const result = calculateAccumulatedTenure(contracts);
    expect(result).toBe(12);
  });

  it('harus mengembalikan 0 jika karyawan belum memiliki kontrak', () => {
    const result = calculateAccumulatedTenure([]);
    expect(result).toBe(0);
  });
});