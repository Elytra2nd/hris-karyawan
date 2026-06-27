/**
 * Util import Excel yang dipakai BERSAMA oleh preview (client) dan
 * action server. Tujuannya: preview memakai normalisasi + format yang
 * sama persis dengan server, sehingga baris yang tampil "Siap" benar-benar
 * lolos saat diimpor (tidak ada lagi "Keterangan kosong tapi gagal").
 *
 * Bukan 'use server' - aman di-import dari komponen client maupun server.
 */
import { parse, isValid, format } from 'date-fns'

// Kolom wajib (untuk deteksi baris header di file Excel)
export const REQUIRED_COLS = [
  'BA', 'BA CABANG', 'CABANG', 'NAMA LENGKAP', 'NO KTP', 'TGL LAHIR',
  'NAMA IBU', 'NO HP', 'FORM CONSENT', 'POSISI', 'TRAINEE SEJAK',
]

// Nama kolom Excel → field schema
export const COL_MAP: Record<string, string> = {
  'BA': 'ba',
  'BA CABANG': 'baCabang',
  'CABANG': 'cabang',
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
}

// ─── Parse tanggal: dukung dd.MM.yyyy, dd/MM/yyyy, ISO, dan serial Excel ──────
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

  // dd-MM-yyyy
  const dashFmt = parse(trimmed, 'dd-MM-yyyy', new Date())
  if (isValid(dashFmt)) return format(dashFmt, 'yyyy-MM-dd')

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

    if (field === 'tglLahir' || field === 'traineeSejak') {
      normalized[field] = parseDate(v)
    } else if (field === 'posisi' || field === 'formConsent' || field === 'cabang') {
      // Enum: samakan ke huruf kapital (mis. "Sales Executive" → "SALES EXECUTIVE")
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
