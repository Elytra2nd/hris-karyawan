/* Sinkron data referensi (cabang + jabatan) ke DB. Idempoten & non-destruktif:
 * hanya menambah yang belum ada, tidak pernah menghapus karyawan/kontrak.
 * Aman dijalankan ulang di instance produksi setiap kali daftar bertambah.
 *   node --env-file=.env scripts/seed-refdata.cjs
 */
const { PrismaClient } = require('@prisma/client')
const { PrismaMariaDb } = require('@prisma/adapter-mariadb')
const adapter = new PrismaMariaDb({host:process.env.DB_HOST??'localhost',port:Number(process.env.DB_PORT??3306),user:process.env.DB_USER??'root',password:process.env.DB_PASSWORD??'',database:process.env.DB_NAME??'hris_karyawan',connectionLimit:1})
const p = new PrismaClient({ adapter })

// Daftar resmi Astra Motor Kalbar (dokumen BA Bu Yanti)
const BRANCHES = [
  { code: 'H720', label: 'PONTIANAK' },
  { code: 'H721', label: 'KETAPANG' },
  { code: 'H722', label: 'PATTIMURA' },
  { code: 'H723', label: 'SINGKAWANG' },
  { code: 'H724', label: 'SANGGAU' },
  { code: 'H725', label: 'IMAM BONJOL' },
  { code: 'H726', label: 'NDS AYANI' },
  { code: 'H727', label: 'BENUA KAYONG' },
  { code: 'H728', label: 'SINTANG' },
  { code: 'H729', label: 'PUTUSSIBAU' },
  { code: 'H730', label: 'SAMBAS' },
]

const POSITIONS = [
  { name: 'ADMINISTRATOR', contractMonths: 3 },
  { name: 'COUNTER SALES', contractMonths: 6 },
  { name: 'MECHANIC', contractMonths: 6 },
  { name: 'MECHANIC PDI', contractMonths: 6 },
  { name: 'PART COUNTER', contractMonths: 6 },
  { name: 'SALES EXECUTIVE', contractMonths: 6 },
  { name: 'SALESGIRL', contractMonths: 6 },
  { name: 'TEAM LEADER', contractMonths: 6 },
  { name: 'LAINNYA', contractMonths: 6 },
]

;(async () => {
  const added = []
  const haveBranch = new Set((await p.branch.findMany({ select: { code: true } })).map(x => x.code))
  const havePos = new Set((await p.position.findMany({ select: { name: true } })).map(x => x.name))

  for (const b of BRANCHES.filter(x => !haveBranch.has(x.code))) {
    await p.branch.create({ data: b })
    added.push(`cabang ${b.code} ${b.label}`)
  }
  for (const pos of POSITIONS.filter(x => !havePos.has(x.name))) {
    await p.position.create({ data: pos })
    added.push(`jabatan ${pos.name} (${pos.contractMonths} bln)`)
  }
  console.log(added.length ? 'Ditambahkan:\n  ' + added.join('\n  ') : 'Sudah sinkron, tidak ada perubahan.')
  console.log(`Total: ${await p.branch.count()} cabang, ${await p.position.count()} jabatan, ${await p.employee.count()} karyawan (utuh).`)
  await p.$disconnect()
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
