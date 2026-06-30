/**
 * Util import Excel yang dipakai BERSAMA oleh preview (client) dan
 * action server. Tujuannya: preview memakai normalisasi + format yang
 * sama persis dengan server, sehingga baris yang tampil "Siap" benar-benar
 * lolos saat diimpor (tidak ada lagi "Keterangan kosong tapi gagal").
 *
 * Bukan 'use server' - aman di-import dari komponen client maupun server.
 */
import { parse, isValid, format } from 'date-fns'

// Nama/singkatan bulan Indonesia & Inggris → nomor bulan (1-12). Menampung
// variasi singkatan dunia nyata (Agu/Agt/Ags, Okt/Oct, Des/Dec, Mei/May, dst)
// karena format date-fns locale terlalu kaku (mis. hanya mengenali "Agt").
const MONTH_NUM: Record<string, number> = {
  jan: 1, januari: 1, january: 1,
  feb: 2, februari: 2, february: 2, peb: 2,
  mar: 3, maret: 3, march: 3, mrt: 3,
  apr: 4, april: 4,
  mei: 5, may: 5, may_: 5,
  jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7,
  agu: 8, agt: 8, ags: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, november: 11, nop: 11, nopember: 11,
  des: 12, dec: 12, desember: 12, december: 12,
}

// Kolom wajib (untuk deteksi baris header di file Excel)
export const REQUIRED_COLS = [
  'CABANG', 'NAMA LENGKAP', 'NO KTP', 'NAMA IBU', 'POSISI', 'TRAINEE SEJAK',
]

// Nama kolom Excel → field schema.
// Mendukung header template ATMS (Bahasa Indonesia) DAN header dari sistem
// lama / export ATMS lama (Bahasa Inggris) agar file historis bisa langsung
// diimpor tanpa rename kolom manual.
export const COL_MAP: Record<string, string> = {
  // ── Header template ATMS ──
  'BA': 'ba',
  'BA CABANG': 'baCabang',
  'CABANG': 'cabang',
  'REGION': 'region',
  'NAMA LENGKAP': 'namaLengkap',
  'NIK': 'nik',
  'NO KTP': 'noKtp',
  'TGL LAHIR': 'tglLahir',
  'NAMA IBU': 'namaIbu',
  'NO HP': 'noHp',
  'NO JAMSOSTEK': 'noJamsostek',
  'FORM CONSENT': 'formConsent',
  'POSISI': 'posisi',
  'TRAINEE SEJAK': 'traineeSejak',
  'TRAINEE SELESAI': 'traineeSelesai',
  'GENDER': 'gender',
  'JENIS KELAMIN': 'gender',
  'L/P': 'gender',
  'NO. PERJANJIAN': 'contractNumber',
  'NO PERJANJIAN': 'contractNumber',
  'NO.PERJANJIAN': 'contractNumber',
  'NOMOR PERJANJIAN': 'contractNumber',

  // ── Header sistem lama / export (Bahasa Inggris) ──
  'BRANCH CODE': 'cabang',
  'BRANCH NAME': 'baCabang',
  'FULL NAME': 'namaLengkap',
  'BIRTH MOTHER\'S NAME': 'namaIbu',
  'MOTHER NAME': 'namaIbu',
  'POSITION': 'posisi',
  'TRAINING START DATE': 'traineeSejak',
  'TRAINING END DATE': 'traineeSelesai',
  'CONTRACT NUMBER': 'contractNumber',
  'SEX': 'gender',
  'RESIDENT IDENTIFICATION': 'noKtp',
  'KTP': 'noKtp',
  'DATE OF BIRTH': 'tglLahir',
  'BIRTH DATE': 'tglLahir',
  'PHONE': 'noHp',
  'PHONE NUMBER': 'noHp',
}

// Alias posisi: nama jabatan di file historis → nama posisi kanonik di sistem.
// Mis. dokumen lama menulis "SALESMAN"/"MEKANIK", sistem memakai
// "SALES EXECUTIVE"/"MECHANIC".
export const POSISI_ALIAS: Record<string, string> = {
  'SALESMAN': 'SALES EXECUTIVE',
  'SALES MAN': 'SALES EXECUTIVE',
  'MEKANIK': 'MECHANIC',
  'MEKANIC': 'MECHANIC',
  'SALES GIRL': 'SALESGIRL',
  'COUNTER': 'COUNTER SALES',
  'ADMIN': 'ADMINISTRATOR',
  'ADMINISTRASI': 'ADMINISTRATOR',
}

// ─── Parse tanggal: dukung dd.MM.yyyy, dd/MM/yyyy, dd-MMM-yy (Indo/Eng),
//     ISO, dan serial Excel ──────────────────────────────────────────────────
export function parseDate(raw: string): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (trimmed === '' || trimmed === '-') return null

  // dd.MM.yyyy
  const dotFmt = parse(trimmed, 'dd.MM.yyyy', new Date())
  if (isValid(dotFmt)) return format(dotFmt, 'yyyy-MM-dd')

  // dd/MM/yyyy
  const slashFmt = parse(trimmed, 'dd/MM/yyyy', new Date())
  if (isValid(slashFmt)) return format(slashFmt, 'yyyy-MM-dd')

  // dd-MM-yyyy (angka)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const dashFmt = parse(trimmed, 'dd-MM-yyyy', new Date())
    if (isValid(dashFmt)) return format(dashFmt, 'yyyy-MM-dd')
  }

  // dd-MMM-yy / dd-MMM-yyyy dengan nama bulan (mis. "01-Nov-21", "30-Okt-22",
  // "01-Agu-26", "01-Des-25"). Parse manual agar tahan variasi singkatan.
  const namedMonth = trimmed.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,})[-/ ](\d{2,4})$/)
  if (namedMonth) {
    const dd = parseInt(namedMonth[1], 10)
    const mon = MONTH_NUM[namedMonth[2].toLowerCase()]
    let yy = parseInt(namedMonth[3], 10)
    if (namedMonth[3].length <= 2) yy = yy <= 70 ? 2000 + yy : 1900 + yy
    if (mon && dd >= 1 && dd <= 31) {
      const d = new Date(yy, mon - 1, dd)
      if (isValid(d) && d.getDate() === dd && d.getMonth() === mon - 1) {
        return `${yy}-${String(mon).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
      }
    }
  }

  // yyyy-MM-dd (ISO, termasuk hasil cellDates xlsx yang sudah diformat)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  // Serial Excel (jumlah hari sejak 1899-12-30). Gunakan komponen UTC agar
  // tidak bergeser satu hari karena timezone.
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = parseFloat(trimmed)
    if (serial > 0 && serial < 100000) {
      const utc = new Date(Math.round((serial - 25569) * 86400000))
      if (isValid(utc)) {
        const yyyy = utc.getUTCFullYear()
        const mm = String(utc.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(utc.getUTCDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      }
    }
  }

  return null
}

// ─── Normalisasi 1 baris Excel → objek field schema ──────────────────────────
// Lebih toleran terhadap data "campur": enum di-uppercase, KTP/HP diambil
// angkanya saja, agar data dunia nyata tetap lolos validasi.
export function normalizeRow(raw: Record<string, string>): Record<string, string | null> {
  const normalized: Record<string, string | null> = {}
  for (const [col, val] of Object.entries(raw)) {
    const field = COL_MAP[col.toUpperCase().trim()]
    if (!field) continue
    const v = (val ?? '').toString().trim()

    if (field === 'tglLahir' || field === 'traineeSejak' || field === 'traineeSelesai') {
      normalized[field] = parseDate(v)
    } else if (field === 'posisi') {
      // Enum + alias: samakan ke huruf kapital lalu petakan varian historis.
      const up = v === '' || v === '-' ? null : v.toUpperCase()
      normalized[field] = up ? (POSISI_ALIAS[up] ?? up) : null
    } else if (field === 'gender') {
      // Samakan ke L / P dari berbagai penulisan.
      const up = v.toUpperCase()
      if (['L', 'LAKI', 'LAKI-LAKI', 'PRIA', 'MALE', 'M'].includes(up)) normalized[field] = 'L'
      else if (['P', 'PEREMPUAN', 'WANITA', 'FEMALE', 'F'].includes(up)) normalized[field] = 'P'
      else normalized[field] = null
    } else if (field === 'formConsent' || field === 'cabang') {
      // Enum: samakan ke huruf kapital (mis. "Ada" → "ADA")
      normalized[field] = v === '' || v === '-' ? null : v.toUpperCase()
    } else if (field === 'noKtp') {
      // Ambil digit saja (buang spasi/strip/titik)
      const digits = v.replace(/\D/g, '')
      normalized[field] = digits === '' ? null : digits
    } else if (field === 'noHp') {
      // Ambil digit saja; ubah awalan 62 → 0 (format HP Indonesia)
      let digits = v.replace(/\D/g, '')
      if (digits.startsWith('62')) digits = '0' + digits.slice(2)
      normalized[field] = digits === '' ? null : digits
    } else {
      normalized[field] = v === '' || v === '-' ? null : v
    }
  }
  return normalized
}
