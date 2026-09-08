import { describe, it, expect } from 'vitest'
import { calculateEndDate, totalTenureMonths, splitTenure, contractStatus, contractDaysLeft, SEGERA_HABIS_HARI, durasiBisaDipilih, bandingkanJabatan, JABATAN_DURASI_BEBAS } from '@/lib/contract'
import { formatBranch } from '@/lib/branch'

// Menguji rumus ASLI di src/lib/contract.ts — dipakai form input, action
// createEmployee/createContract, dan importer. Kalau rumusnya berubah,
// tanggal selesai di kontrak resmi trainee ikut berubah.
describe('Kontrak — tanggal selesai (inklusif)', () => {
  it('6 bulan dari 1 Juli 2025 berakhir 31 Desember 2025', () => {
    expect(calculateEndDate(new Date(2025, 6, 1), 6)).toEqual(new Date(2025, 11, 31))
  })

  it('3 bulan dari 1 Desember 2025 berakhir 28 Februari 2026 (lintas tahun)', () => {
    expect(calculateEndDate(new Date(2025, 11, 1), 3)).toEqual(new Date(2026, 1, 28))
  })

  it('menyesuaikan bulan pendek: 31 Januari + 1 bulan berakhir 27 Februari', () => {
    // addMonths menjepit ke 28 Feb, lalu mundur 1 hari.
    expect(calculateEndDate(new Date(2025, 0, 31), 1)).toEqual(new Date(2025, 1, 27))
  })

  it('tahun kabisat: 6 bulan dari 1 September 2027 berakhir 29 Februari 2028', () => {
    expect(calculateEndDate(new Date(2027, 8, 1), 6)).toEqual(new Date(2028, 1, 29))
  })
})

describe('Kontrak — akumulasi masa kerja', () => {
  const kontrak = [
    { traineeSejak: '2021-11-01', traineeSelesai: '2022-04-30' }, // 5 bln penuh
    { traineeSejak: '2022-05-01', traineeSelesai: '2022-10-31' },
    { traineeSejak: '2022-11-01', traineeSelesai: '2023-04-30' },
  ]

  it('menjumlahkan seluruh periode kontrak', () => {
    expect(totalTenureMonths(kontrak)).toBe(15)
  })

  it('trainee tanpa kontrak = 0 bulan', () => {
    expect(totalTenureMonths([])).toBe(0)
  })

  it('memecah total bulan jadi tahun + sisa bulan', () => {
    expect(splitTenure(15)).toEqual({ years: 1, months: 3 })
    expect(splitTenure(0)).toEqual({ years: 0, months: 0 })
    expect(splitTenure(24)).toEqual({ years: 2, months: 0 })
  })
})

// Status kontrak dipakai DUA tempat dgn konsekuensi berbeda: chip di tabel dan
// kolom di export Excel yang dikirim ke HO. Kalau keduanya menyimpang, laporan
// menyebut "Aktif" untuk baris yang di layar "Expired".
describe('Kontrak — status', () => {
  const kini = new Date(2026, 8, 6) // 6 Sep 2026

  it('karyawan non-aktif selalu Non-Aktif, apa pun kontraknya', () => {
    // Kontrak masih lama berlaku, tapi orangnya sudah keluar.
    expect(contractStatus('NON_AKTIF', new Date(2027, 0, 1), kini)).toBe('Non-Aktif')
  })

  it('lewat tanggal selesai → Expired', () => {
    expect(contractStatus('AKTIF', new Date(2026, 8, 5), kini)).toBe('Expired')
  })

  it('tepat di ambang 30 hari masih Segera Habis, 31 hari sudah Aktif', () => {
    const batas = new Date(2026, 8, 6 + SEGERA_HABIS_HARI)
    const lewat = new Date(2026, 8, 6 + SEGERA_HABIS_HARI + 1)
    expect(contractStatus('AKTIF', batas, kini)).toBe('Segera Habis')
    expect(contractStatus('AKTIF', lewat, kini)).toBe('Aktif')
  })

  it('hari terakhir (sisa 0) belum Expired — kontrak inklusif', () => {
    expect(contractStatus('AKTIF', kini, kini)).toBe('Segera Habis')
  })

  it('tanpa kontrak → Aktif, bukan Expired', () => {
    // Trainee baru yang kontraknya belum dibuat tak boleh tampak kedaluwarsa.
    expect(contractStatus('AKTIF', null, kini)).toBe('Aktif')
  })

  it('sisa hari: negatif bila lewat, null bila tak ada kontrak', () => {
    expect(contractDaysLeft(new Date(2026, 8, 1), kini)).toBe(-5)
    expect(contractDaysLeft(new Date(2026, 8, 16), kini)).toBe(10)
    expect(contractDaysLeft(null, kini)).toBeNull()
  })
})

describe('Label cabang — kode + nama daerah', () => {
  it('menggabungkan kode & nama supaya tak perlu dihafal', () => {
    expect(formatBranch('H720', 'PONTIANAK')).toBe('H720 — PONTIANAK')
  })

  it('tidak menduplikasi bila kode & nama sama', () => {
    expect(formatBranch('H720', 'H720')).toBe('H720')
  })

  it('jatuh ke yang tersedia bila salah satu kosong', () => {
    expect(formatBranch('H720', null)).toBe('H720')
    expect(formatBranch('', 'PONTIANAK')).toBe('PONTIANAK')
    expect(formatBranch(null, null)).toBe('-')
  })
})

describe('Jabatan LAINNYA — satu-satunya yang durasinya bisa dipilih', () => {
  it('hanya LAINNYA yang boleh menyimpang dari bawaan', () => {
    expect(durasiBisaDipilih(JABATAN_DURASI_BEBAS)).toBe(true)
    expect(durasiBisaDipilih('ADMINISTRATOR')).toBe(false)
    expect(durasiBisaDipilih('SALES EXECUTIVE')).toBe(false)
  })

  // Nama jabatan di-uppercase saat disimpan, tapi bisa datang dari importer
  // Excel atau request rakitan dalam bentuk apa pun.
  it('tak peduli huruf besar-kecil & spasi berlebih', () => {
    expect(durasiBisaDipilih(' lainnya ')).toBe(true)
    expect(durasiBisaDipilih('Lainnya')).toBe(true)
  })

  it('nilai kosong bukan LAINNYA', () => {
    expect(durasiBisaDipilih('')).toBe(false)
    expect(durasiBisaDipilih(null)).toBe(false)
    expect(durasiBisaDipilih(undefined)).toBe(false)
  })
})

describe('Urutan jabatan — LAINNYA di paling bawah', () => {
  it('mengurutkan A–Z tapi menyisihkan LAINNYA ke akhir', () => {
    const acak = ['SALESGIRL', 'LAINNYA', 'ADMINISTRATOR', 'MECHANIC']
    expect([...acak].sort(bandingkanJabatan)).toEqual([
      'ADMINISTRATOR', 'MECHANIC', 'SALESGIRL', 'LAINNYA',
    ])
  })

  // Tanpa aturan khusus, alfabet menaruh LAINNYA di tengah — persis di antara
  // dua jabatan yang huruf awalnya mengapitnya, sehingga terbaca seperti
  // jabatan biasa.
  it('LAINNYA tetap terakhir walau alfabet menaruhnya di tengah', () => {
    const urut = ['KURIR', 'LAINNYA', 'MECHANIC'].sort(bandingkanJabatan)
    expect(urut.at(-1)).toBe('LAINNYA')
  })

  it('daftar tanpa LAINNYA tetap urut alfabet', () => {
    expect(['MECHANIC', 'ADMINISTRATOR'].sort(bandingkanJabatan)).toEqual([
      'ADMINISTRATOR', 'MECHANIC',
    ])
  })
})
