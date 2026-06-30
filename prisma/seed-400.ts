/**
 * Seeder 400 karyawan — Astra Motor Kalbar (H721-H730)
 * Jalankan: npx tsx --env-file=.env prisma/seed-400.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hris_karyawan',
})

const prisma = new PrismaClient({ adapter })

// ── Helpers ────────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function randomDate(startYear: number, endYear: number): Date {
  const y = randInt(startYear, endYear)
  const m = randInt(1, 12)
  const d = randInt(1, 28)
  return new Date(`${y}-${pad(m)}-${pad(d)}`)
}

function randomPhone(): string {
  const prefixes = ['0812', '0813', '0821', '0822', '0852', '0853', '0857', '0858', '0811', '0896']
  return pick(prefixes) + Array.from({ length: 8 }, () => randInt(0, 9)).join('')
}

function randomKtp(regionCode: string): string {
  return regionCode + Array.from({ length: 12 }, () => randInt(0, 9)).join('')
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function subDays(date: Date, days: number): Date {
  return addDays(date, -days)
}

// ── Master Data ────────────────────────────────────────────────────────────────
const CABANG_DATA = [
  { code: 'H721', label: 'KETAPANG',     ktp: '6104' },
  { code: 'H722', label: 'PATTIMURA',    ktp: '6171' },
  { code: 'H723', label: 'SINGKAWANG',   ktp: '6172' },
  { code: 'H724', label: 'SANGGAU',      ktp: '6108' },
  { code: 'H725', label: 'IMAM BONJOL',  ktp: '6171' },
  { code: 'H726', label: 'NDS AYANI',    ktp: '6171' },
  { code: 'H727', label: 'BENUA KAYONG', ktp: '6104' },
  { code: 'H728', label: 'SINTANG',      ktp: '6105' },
  { code: 'H729', label: 'PUTUSSIBAU',   ktp: '6106' },
  { code: 'H730', label: 'SAMBAS',       ktp: '6101' },
]

const POSISI_DATA = [
  { name: 'SALES EXECUTIVE', contractMonths: 6 },
  { name: 'SALESGIRL',       contractMonths: 6 },
  { name: 'COUNTER SALES',   contractMonths: 6 },
  { name: 'MECHANIC',        contractMonths: 6 },
  { name: 'TEAM LEADER',     contractMonths: 6 },
  { name: 'ADMINISTRATOR',   contractMonths: 3 },
]

// Distribusi posisi yang realistis (lebih banyak sales & mechanic)
const POSISI_POOL = [
  ...Array(8).fill('SALES EXECUTIVE'),
  ...Array(4).fill('SALESGIRL'),
  ...Array(3).fill('COUNTER SALES'),
  ...Array(5).fill('MECHANIC'),
  ...Array(2).fill('TEAM LEADER'),
  ...Array(2).fill('ADMINISTRATOR'),
]

const NAMA_DEPAN_L = [
  'Ahmad', 'Budi', 'Cahya', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hendra',
  'Irfan', 'Joko', 'Kurniawan', 'Lukman', 'Muhammad', 'Nasir', 'Oscar',
  'Putra', 'Rendi', 'Slamet', 'Teguh', 'Umar', 'Wahyu', 'Yusuf', 'Zainul',
  'Agus', 'Bambang', 'Andi', 'Reza', 'Rizky', 'Dian', 'Bayu', 'Feri',
  'Hendri', 'Ikhsan', 'Joni', 'Kevin', 'Lianto', 'Marsel', 'Novan', 'Okta',
]

const NAMA_DEPAN_P = [
  'Siti', 'Ani', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Heni', 'Ika',
  'Juliana', 'Kartini', 'Lestari', 'Maya', 'Nita', 'Okta', 'Putri',
  'Rina', 'Sri', 'Tina', 'Umi', 'Vina', 'Wulan', 'Yanti', 'Zahra',
  'Ratna', 'Nurul', 'Dian', 'Reni', 'Suci', 'Indah', 'Ayu', 'Bella',
  'Clara', 'Diana', 'Elsa', 'Fika', 'Gracia', 'Hilda', 'Intan', 'Jessa',
]

const NAMA_BELAKANG = [
  'Pratama', 'Wijaya', 'Santoso', 'Kurniawan', 'Putra', 'Saputra', 'Hidayat',
  'Nugraha', 'Firmansyah', 'Ramadhan', 'Setiawan', 'Wibowo', 'Susanto',
  'Hartono', 'Suryadi', 'Permana', 'Maulana', 'Hakim', 'Fauzi', 'Prasetyo',
  'Utami', 'Rahayu', 'Handayani', 'Wulandari', 'Lestari', 'Sari', 'Maharani',
  'Anggraeni', 'Puspitasari', 'Safitri', 'Oktaviani', 'Nurdiana',
  'Wahyudi', 'Hendrianto', 'Prabowo', 'Kusuma', 'Adiputra', 'Ariadi',
]

const NAMA_IBU = [
  'Siti Aminah', 'Nur Hasanah', 'Sri Wahyuni', 'Aisyah', 'Fatimah',
  'Rosmawati', 'Kartini', 'Sumiati', 'Rahmawati', 'Yulia', 'Endang',
  'Sulastri', 'Mariam', 'Nurjannah', 'Suryati', 'Warsini', 'Darmi',
  'Sumiyati', 'Jariah', 'Rukmini', 'Salmah', 'Rohana', 'Hamidah',
  'Zubaedah', 'Mardiyah', 'Sariyem', 'Tumini', 'Pariyem', 'Mulyati',
]

// ── Contract Scenarios ─────────────────────────────────────────────────────────
// Buat skenario kontrak yang beragam agar dashboard alert bervariasi
function makeContracts(posisi: string, now: Date): Array<{
  posisi: string; traineeSejak: Date; traineeSelesai: Date; contractNumber: string | null
}> {
  const months = posisi === 'ADMINISTRATOR' ? 3 : 6
  const scenario = randInt(1, 10)
  const withContractNumber = Math.random() > 0.4

  const makeNumber = (idx: number) =>
    withContractNumber ? `PKL/${randInt(2020, 2026)}/${pad(randInt(1, 999), 3)}/${idx > 1 ? `R${idx - 1}` : '001'}` : null

  if (scenario <= 2) {
    // Kontrak aktif, aman (>90 hari sisa)
    const sejak = subDays(now, randInt(30, 90))
    const selesai = addDays(now, randInt(91, 150))
    return [{ posisi, traineeSejak: sejak, traineeSelesai: selesai, contractNumber: makeNumber(1) }]
  }

  if (scenario <= 4) {
    // Kontrak mendekati habis (31-90 hari)
    const sejak = subDays(now, randInt(90, 150))
    const selesai = addDays(now, randInt(31, 90))
    return [{ posisi, traineeSejak: sejak, traineeSelesai: selesai, contractNumber: makeNumber(1) }]
  }

  if (scenario <= 6) {
    // Kontrak kritis (<30 hari)
    const sejak = subDays(now, randInt(150, 180))
    const selesai = addDays(now, randInt(1, 29))
    return [{ posisi, traineeSejak: sejak, traineeSelesai: selesai, contractNumber: makeNumber(1) }]
  }

  if (scenario <= 7) {
    // Kontrak expired (belum diperpanjang)
    const sejak = subDays(now, randInt(200, 365))
    const selesai = subDays(now, randInt(1, 60))
    return [{ posisi, traineeSejak: sejak, traineeSelesai: selesai, contractNumber: makeNumber(1) }]
  }

  if (scenario <= 9) {
    // Riwayat kontrak: kontrak lama selesai + perpanjang aktif
    const sejak1 = subDays(now, randInt(300, 500))
    const selesai1 = subDays(addMonths(sejak1, months), 1)
    const sejak2 = addDays(selesai1, 1)
    const selesai2 = subDays(addMonths(sejak2, months), 1)
    return [
      { posisi, traineeSejak: sejak1, traineeSelesai: selesai1, contractNumber: makeNumber(1) },
      { posisi, traineeSejak: sejak2, traineeSelesai: selesai2, contractNumber: makeNumber(2) },
    ]
  }

  // Riwayat panjang: 3 periode kontrak
  const sejak1 = subDays(now, randInt(500, 700))
  const selesai1 = subDays(addMonths(sejak1, months), 1)
  const sejak2 = addDays(selesai1, 1)
  const selesai2 = subDays(addMonths(sejak2, months), 1)
  const sejak3 = addDays(selesai2, 1)
  const selesai3 = subDays(addMonths(sejak3, months), 1)
  return [
    { posisi, traineeSejak: sejak1, traineeSelesai: selesai1, contractNumber: makeNumber(1) },
    { posisi, traineeSejak: sejak2, traineeSelesai: selesai2, contractNumber: makeNumber(2) },
    { posisi, traineeSejak: sejak3, traineeSelesai: selesai3, contractNumber: makeNumber(3) },
  ]
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🗑️  Membersihkan data lama...')
  await prisma.contract.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.position.deleteMany()
  await prisma.branch.deleteMany()

  // ── Users ──
  console.log('👤 Setup users...')
  const adminHash = await bcrypt.hash('Admin123', 10)
  const managerHash = await bcrypt.hash('Manager123', 10)
  const staffHash = await bcrypt.hash('Staff123', 10)
  const viewerHash = await bcrypt.hash('Viewer123', 10)

  for (const u of [
    { username: 'admin',   password: adminHash,   role: 'ADMIN' },
    { username: 'manager', password: managerHash, role: 'HR_MANAGER' },
    { username: 'staff',   password: staffHash,   role: 'HR_STAFF' },
    { username: 'viewer',  password: viewerHash,  role: 'VIEWER' },
  ]) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: u.password, role: u.role },
      create: u,
    })
    console.log(`  ✅ ${u.username} / ${u.username === 'admin' ? 'Admin123' : u.username === 'manager' ? 'Manager123' : u.username === 'staff' ? 'Staff123' : 'Viewer123'} (${u.role})`)
  }

  // ── Branches ──
  console.log('\n🏛️  Setup branches (H721-H730)...')
  for (const b of CABANG_DATA) {
    await prisma.branch.create({ data: { code: b.code, label: b.label } })
    console.log(`  ✅ ${b.code} — ${b.label}`)
  }

  // ── Positions ──
  console.log('\n💼 Setup positions...')
  for (const p of POSISI_DATA) {
    await prisma.position.create({ data: p })
    console.log(`  ✅ ${p.name} (${p.contractMonths} bln)`)
  }

  // ── Employees ──
  const TOTAL = 400
  const now = new Date()
  console.log(`\n👷 Membuat ${TOTAL} karyawan...\n`)

  // Distribusi merata: 40 karyawan per cabang (10 cabang × 40 = 400)
  // Campur sedikit agar tidak terlalu rata
  const usedKtps = new Set<string>()

  let created = 0
  let totalContracts = 0

  for (let i = 0; i < TOTAL; i++) {
    const cabang = CABANG_DATA[i % CABANG_DATA.length]
    const posisi = pick(POSISI_POOL)
    const gender: 'L' | 'P' = Math.random() < 0.55 ? 'L' : 'P'
    const namaDepan = gender === 'L' ? pick(NAMA_DEPAN_L) : pick(NAMA_DEPAN_P)
    const namaBelakang = pick(NAMA_BELAKANG)
    const namaLengkap = `${namaDepan} ${namaBelakang}`

    // KTP unik
    let noKtp: string
    do { noKtp = randomKtp(cabang.ktp) } while (usedKtps.has(noKtp))
    usedKtps.add(noKtp)

    const status = Math.random() < 0.85 ? 'AKTIF' : 'NON-AKTIF'
    const contracts = makeContracts(posisi, now)
    // NON-AKTIF: pakai kontrak expired
    if (status === 'NON-AKTIF') {
      for (const c of contracts) {
        if (c.traineeSelesai >= now) {
          c.traineeSelesai = subDays(now, randInt(30, 180))
        }
      }
    }

    const hasNik = Math.random() > 0.3
    const hasJamsostek = Math.random() > 0.45
    const hasTglLahir = Math.random() > 0.05
    const hasNoHp = Math.random() > 0.08
    const formConsent = Math.random() > 0.12 ? 'ADA' : 'TIDAK ADA'

    await prisma.employee.create({
      data: {
        ba: cabang.code,
        baCabang: cabang.label,
        region: 'KALIMANTAN BARAT',
        cabang: cabang.code,
        namaLengkap,
        status,
        gender,
        nik: hasNik ? `NIK${pad(i + 1, 4)}${randInt(100, 999)}` : null,
        noJamsostek: hasJamsostek ? `JST${randInt(10000000, 99999999)}` : null,
        noKtp,
        tglLahir: hasTglLahir ? randomDate(1985, 2003) : null,
        namaIbu: pick(NAMA_IBU),
        noHp: hasNoHp ? randomPhone() : null,
        formConsent,
        contracts: {
          create: contracts.map(c => ({
            posisi: c.posisi,
            traineeSejak: c.traineeSejak,
            traineeSelesai: c.traineeSelesai,
            contractNumber: c.contractNumber,
          })),
        },
      },
    })

    created++
    totalContracts += contracts.length

    const statusEmoji = status === 'AKTIF' ? '🟢' : '🔴'
    process.stdout.write(
      `  ${statusEmoji} ${pad(created, 3)}/${TOTAL} ${namaLengkap.padEnd(30)} | ${cabang.code} ${cabang.label.padEnd(13)} | ${posisi.padEnd(16)} | ${contracts.length}x kontrak\n`
    )
  }

  // ── Summary ──
  const [empCount, contractCount, aktifCount] = await Promise.all([
    prisma.employee.count(),
    prisma.contract.count(),
    prisma.employee.count({ where: { status: 'AKTIF' } }),
  ])

  const byBranch = await prisma.employee.groupBy({ by: ['cabang'], _count: true })
  const byPosisi = await prisma.contract.groupBy({ by: ['posisi'], _count: true, orderBy: { _count: { posisi: 'desc' } } })

  console.log('\n' + '═'.repeat(65))
  console.log('📊  RINGKASAN SEED DATA')
  console.log('═'.repeat(65))
  console.log(`   👷 Karyawan  : ${empCount} (${aktifCount} aktif, ${empCount - aktifCount} non-aktif)`)
  console.log(`   📄 Kontrak   : ${contractCount}`)
  console.log(`   📍 Distribusi cabang:`)
  for (const b of CABANG_DATA) {
    const cnt = byBranch.find(r => r.cabang === b.code)?._count ?? 0
    const bar = '█'.repeat(Math.round(cnt / 2))
    console.log(`      ${b.code} ${b.label.padEnd(13)} : ${String(cnt).padStart(3)} ${bar}`)
  }
  console.log(`   📋 Distribusi posisi:`)
  for (const p of byPosisi) {
    console.log(`      ${p.posisi.padEnd(18)} : ${p._count}`)
  }
  console.log(`   👤 Users     : admin/Admin123 (ADMIN) | manager/Manager123 (HR_MANAGER)`)
  console.log(`                  staff/Staff123 (HR_STAFF) | viewer/Viewer123 (VIEWER)`)
  console.log('═'.repeat(65))
  console.log('✅ Seed 400 karyawan selesai!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
