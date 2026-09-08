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
import { addMonths, subDays, differenceInMonths, differenceInDays } from 'date-fns'

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

/**
 * Jabatan penampung untuk penempatan non-permanen (permintaan Bu Yanti,
 * 03 Sep 2026) — satu-satunya jabatan yang durasi kontraknya boleh menyimpang
 * dari bawaan.
 *
 * Sengaja konstanta, bukan kolom baru di tabel `Position`: hanya satu baris yang
 * memerlukannya, dan kolom `boleh_pilih_durasi` berarti migration di database
 * produksi yang sudah berisi data HR asli — biaya yang tak sebanding dgn satu
 * pengecualian. Kalau nanti jabatan lain butuh perilaku sama, barulah naikkan
 * jadi kolom.
 */
export const JABATAN_DURASI_BEBAS = 'LAINNYA'

/** Apakah durasi kontrak jabatan ini boleh dipilih manual. */
export function durasiBisaDipilih(posisi: string | null | undefined): boolean {
  return (posisi ?? '').trim().toUpperCase() === JABATAN_DURASI_BEBAS
}

/**
 * Urutan tampil jabatan: A–Z, tapi LAINNYA selalu paling bawah.
 *
 * LAINNYA bukan jabatan sejajar melainkan penampung sisa, jadi menaruhnya di
 * antara KURIR dan MECHANIC (urutan alfabet) membuatnya terbaca seperti pilihan
 * biasa. Dipusatkan di sini karena daftar jabatan muncul di combobox form,
 * filter tabel, filter export, dan template import — kalau tiap tempat
 * mengurutkan sendiri, satu-dua di antaranya pasti ketinggalan.
 */
export function bandingkanJabatan(a: string, b: string): number {
  const aLain = durasiBisaDipilih(a)
  const bLain = durasiBisaDipilih(b)
  if (aLain !== bLain) return aLain ? 1 : -1
  return a.localeCompare(b, 'id')
}

export type ContractStatus = 'Non-Aktif' | 'Expired' | 'Segera Habis' | 'Aktif'

/** Ambang "segera habis" (hari). Sama dgn KPI dashboard & filter tabel. */
export const SEGERA_HABIS_HARI = 30

/**
 * Status kontrak seperti yang tampil di kolom STATUS tabel trainee.
 *
 * Dipusatkan di sini karena dipakai DUA tempat dgn konsekuensi berbeda: chip
 * di tabel dan kolom di export Excel. Kalau rumusnya disalin, laporan yang
 * dikirim ke HO bisa menyebut "Aktif" untuk baris yang di layar "Expired" —
 * selisih yang tak terlihat sampai ada yang membandingkan keduanya.
 */
export function contractStatus(
  employeeStatus: string,
  traineeSelesai: Date | string | null | undefined,
  now: Date = new Date(),
): ContractStatus {
  if (employeeStatus !== 'AKTIF') return 'Non-Aktif'
  if (!traineeSelesai) return 'Aktif'
  const sisa = differenceInDays(new Date(traineeSelesai), now)
  if (sisa < 0) return 'Expired'
  if (sisa <= SEGERA_HABIS_HARI) return 'Segera Habis'
  return 'Aktif'
}

/** Sisa hari kontrak; null bila tak ada kontrak. Negatif = sudah lewat. */
export function contractDaysLeft(
  traineeSelesai: Date | string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!traineeSelesai) return null
  return differenceInDays(new Date(traineeSelesai), now)
}
