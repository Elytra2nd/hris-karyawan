/**
 * Aturan tanggal kontrak trainee — satu sumber kebenaran.
 *
 * Sebelumnya rumus yang sama disalin di 4 tempat (employee.ts, import.ts,
 * contract-form.tsx, employee-form.tsx) dan akumulasi masa kerja di 2 tempat,
 * jadi perbaikan di satu file diam-diam meleset di file lain.
 *
 * Murni (tanpa akses DB) supaya bisa dipakai server maupun client, dan bisa
 * dites langsung.
 */
import { addMonths, subDays, differenceInMonths } from 'date-fns'

/**
 * Hari terakhir periode kontrak (INKLUSIF): +N bulan lalu mundur 1 hari.
 * mis. mulai 01 Jul + 6 bulan → 31 Des (bukan 01 Jan).
 */
export function calculateEndDate(startDate: Date, months: number): Date {
  return subDays(addMonths(startDate, months), 1)
}

/** Total masa kerja (bulan) dari seluruh periode kontrak. */
export function totalTenureMonths(
  contracts: { traineeSejak: Date | string; traineeSelesai: Date | string }[],
): number {
  return contracts.reduce(
    (acc, c) => acc + differenceInMonths(new Date(c.traineeSelesai), new Date(c.traineeSejak)),
    0,
  )
}

/** Pecah total bulan jadi tahun + sisa bulan untuk ditampilkan. */
export function splitTenure(totalMonths: number): { years: number; months: number } {
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 }
}
