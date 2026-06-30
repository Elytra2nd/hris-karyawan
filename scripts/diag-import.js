/* Diagnosa file import: bongkar tiap sel jadi {tipe, nilai} supaya kelihatan
 * kenapa baris tertentu gagal. Jalankan:
 *   node scripts/diag-import.js "/path/ke/file.xlsx"
 */
const path = require('path')
const XLSX = require(path.join(__dirname, '..', 'node_modules', 'xlsx'))

const file = process.argv[2]
if (!file) { console.error('Usage: node scripts/diag-import.js <file.xlsx>'); process.exit(1) }

const wb = XLSX.read(require('fs').readFileSync(file), { type: 'buffer', cellDates: true })
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

// Cari header
let hIdx = 0
for (let i = 0; i < Math.min(rows.length, 5); i++) {
  if (rows[i].some(c => String(c).toUpperCase().includes('NAMA') || String(c).toUpperCase().includes('NAME'))) { hIdx = i; break }
}
const header = rows[hIdx].map(c => String(c).trim())
console.log('HEADER row', hIdx, ':', JSON.stringify(header))

const sejakCol = header.findIndex(h => /trainee sejak|training start/i.test(h))
const selesaiCol = header.findIndex(h => /trainee selesai|training end/i.test(h))
const namaCol = header.findIndex(h => /nama lengkap|full name/i.test(h))

const desc = (v) => v instanceof Date ? `Date(${v.toISOString()})` : `${typeof v}:${JSON.stringify(v)}`

rows.slice(hIdx + 1).forEach((r, i) => {
  if (!r.some(c => String(c).trim() !== '')) return
  console.log(
    `row${i + 1}`,
    'nama=', String(r[namaCol]).slice(0, 14).padEnd(14),
    'SEJAK=', desc(r[sejakCol]).padEnd(28),
    'SELESAI=', desc(r[selesaiCol]),
  )
})
