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

// ── Helper ──────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function randomDate(startYear: number, endYear: number): string {
  const y = randInt(startYear, endYear)
  const m = randInt(1, 12)
  const d = randInt(1, 28)
  return `${y}-${pad(m)}-${pad(d)}`
}

function randomPhone(): string {
  const prefixes = ['0812', '0813', '0857', '0858', '0821', '0822', '0852', '0853', '0811', '0896']
  return pick(prefixes) + Array.from({ length: 8 }, () => randInt(0, 9)).join('')
}

function randomKtp(regionCode: string): string {
  return regionCode + Array.from({ length: 10 }, () => randInt(0, 9)).join('')
}

// ── Data Pools ──────────────────────────────────────────
const NAMA_DEPAN = [
  'Ahmad', 'Budi', 'Cahya', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hendra',
  'Irfan', 'Joko', 'Kurniawan', 'Lukman', 'Muhammad', 'Nasir', 'Oscar',
  'Putra', 'Rendi', 'Slamet', 'Teguh', 'Umar', 'Wahyu', 'Yusuf', 'Zainul',
  'Siti', 'Ani', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Heni', 'Ika',
  'Juliana', 'Kartini', 'Lestari', 'Maya', 'Nita', 'Okta', 'Putri',
  'Rina', 'Sri', 'Tina', 'Umi', 'Vina', 'Wulan', 'Yanti', 'Zahra',
  'Dian', 'Ratna', 'Nurul', 'Agus', 'Bambang', 'Andi', 'Reza', 'Rizky',
]

const NAMA_BELAKANG = [
  'Pratama', 'Wijaya', 'Santoso', 'Kurniawan', 'Putra', 'Saputra', 'Hidayat',
  'Nugraha', 'Firmansyah', 'Ramadhan', 'Setiawan', 'Wibowo', 'Susanto',
  'Hartono', 'Suryadi', 'Permana', 'Maulana', 'Hakim', 'Fauzi', 'Prasetyo',
  'Utami', 'Rahayu', 'Handayani', 'Wulandari', 'Lestari', 'Sari', 'Maharani',
  'Anggraeni', 'Puspitasari', 'Kusumawardani', 'Safitri', 'Oktaviani',
]

const NAMA_IBU = [
  'Siti Aminah', 'Nur Hasanah', 'Sri Wahyuni', 'Aisyah', 'Fatimah',
  'Rosmawati', 'Kartini', 'Sumiati', 'Rahmawati', 'Yulia', 'Endang',
  'Sulastri', 'Mariam', 'Nurjannah', 'Suryati', 'Warsini', 'Darmi',
  'Sumiyati', 'Jariah', 'Rukmini',
]

// Cabang Astra Motor Kalbar yang realistis
const CABANG_DATA = [
  { cabang: 'PONTIANAK 1',     region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730A', ktp: '6171' },
  { cabang: 'PONTIANAK 2',     region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730B', ktp: '6171' },
  { cabang: 'KUBU RAYA',       region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730C', ktp: '6112' },
  { cabang: 'MEMPAWAH',        region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730D', ktp: '6101' },
  { cabang: 'SINGKAWANG',      region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730E', ktp: '6172' },
  { cabang: 'SAMBAS',          region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730F', ktp: '6101' },
  { cabang: 'KETAPANG',        region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730G', ktp: '6104' },
  { cabang: 'SINTANG',         region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730H', ktp: '6105' },
  { cabang: 'SANGGAU',         region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730I', ktp: '6108' },
  { cabang: 'LANDAK',          region: 'KALIMANTAN BARAT', ba: 'H730', baCabang: 'H730J', ktp: '6110' },
]

const POSISI = [
  'SALES EXECUTIVE', 'SALES EXECUTIVE', 'SALES EXECUTIVE',  // Higher weight
  'SALESGIRL', 'SALESGIRL',
  'COUNTER SALES', 'COUNTER SALES',
  'MECHANIC', 'MECHANIC', 'MECHANIC',
  'TEAM LEADER',
  'ADMINISTRATOR',
]

const STATUS = ['AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'AKTIF', 'TIDAK AKTIF'] // 87.5% aktif

const DEPARTMENTS = [
  { name: 'Sales & Marketing',   code: 'SM' },
  { name: 'Service & Aftersales', code: 'SA' },
  { name: 'Parts & Sparepart',   code: 'PS' },
  { name: 'Finance & Accounting', code: 'FA' },
  { name: 'HRD & GA',            code: 'HR' },
  { name: 'IT & Digital',        code: 'IT' },
]

// ── Main ────────────────────────────────────────────────
async function main() {
  console.log('🗑️  Membersihkan data lama...')
  await prisma.contract.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.department.deleteMany()
  await prisma.auditLog.deleteMany()
  // Keep existing users, just ensure admin exists

  // 1. Users
  console.log('👤 Setup users...')
  const adminHash = await bcrypt.hash('admin123', 10)
  const viewerHash = await bcrypt.hash('viewer123', 10)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: adminHash },
    create: { username: 'admin', password: adminHash, role: 'ADMIN' },
  })
  await prisma.user.upsert({
    where: { username: 'viewer' },
    update: { password: viewerHash },
    create: { username: 'viewer', password: viewerHash, role: 'VIEWER' },
  })
  console.log('  ✅ admin / admin123  (ADMIN)')
  console.log('  ✅ viewer / viewer123 (VIEWER)')

  // 2. Departments
  console.log('🏢 Setup departments...')
  const deptMap: Record<string, string> = {}
  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.create({ data: dept })
    deptMap[dept.code] = created.id
    console.log(`  ✅ ${dept.name} (${dept.code})`)
  }

  // Map posisi → department code
  const posisiToDept: Record<string, string> = {
    'SALES EXECUTIVE': 'SM', 'SALESGIRL': 'SM', 'COUNTER SALES': 'SM',
    'MECHANIC': 'SA',
    'TEAM LEADER': 'SM',
    'ADMINISTRATOR': 'FA',
  }

  // 3. Employees + Contracts
  const TOTAL = 500
  console.log(`\n👷 Membuat ${TOTAL} karyawan dengan kontrak...`)

  for (let i = 1; i <= TOTAL; i++) {
    const namaDepan = pick(NAMA_DEPAN)
    const namaBelakang = pick(NAMA_BELAKANG)
    const namaLengkap = `${namaDepan} ${namaBelakang}`

    const cab = pick(CABANG_DATA)
    const posisi = pick(POSISI)
    const status = pick(STATUS)
    const deptCode = posisiToDept[posisi] ?? 'HR'
    const departmentId = deptMap[deptCode]

    // Tanggal lahir: 1985-2003
    const tglLahir = randomDate(1985, 2003)

    // Kontrak: variasi yang beragam
    const now = new Date()
    const contracts: Array<{ posisi: string; traineeSejak: Date; traineeSelesai: Date }> = []

    // Variasi kontrak
    const scenario = randInt(1, 10)

    if (scenario <= 3) {
      // Kontrak aktif, masih lama (>90 hari) — AMAN
      const mulai = new Date(now)
      mulai.setMonth(mulai.getMonth() - randInt(1, 3))
      const selesai = new Date(now)
      selesai.setMonth(selesai.getMonth() + randInt(4, 10))
      contracts.push({ posisi, traineeSejak: mulai, traineeSelesai: selesai })
    } else if (scenario <= 5) {
      // Kontrak mendekati habis (30-90 hari) — PERLU PERHATIAN
      const mulai = new Date(now)
      mulai.setMonth(mulai.getMonth() - randInt(3, 5))
      const selesai = new Date(now)
      selesai.setDate(selesai.getDate() + randInt(30, 89))
      contracts.push({ posisi, traineeSejak: mulai, traineeSelesai: selesai })
    } else if (scenario <= 7) {
      // Kontrak kritis (<30 hari) — KRITIS
      const mulai = new Date(now)
      mulai.setMonth(mulai.getMonth() - randInt(4, 6))
      const selesai = new Date(now)
      selesai.setDate(selesai.getDate() + randInt(1, 29))
      contracts.push({ posisi, traineeSejak: mulai, traineeSelesai: selesai })
    } else if (scenario <= 8) {
      // Kontrak sudah expired — EXPIRED
      const mulai = new Date(now)
      mulai.setMonth(mulai.getMonth() - randInt(6, 12))
      const selesai = new Date(now)
      selesai.setDate(selesai.getDate() - randInt(1, 60))
      contracts.push({ posisi, traineeSejak: mulai, traineeSelesai: selesai })
    } else {
      // Punya histori kontrak (perpanjangan)
      // Kontrak lama (sudah selesai)
      const mulai1 = new Date(now)
      mulai1.setMonth(mulai1.getMonth() - randInt(10, 18))
      const selesai1 = new Date(mulai1)
      selesai1.setMonth(selesai1.getMonth() + 6)
      contracts.push({ posisi, traineeSejak: mulai1, traineeSelesai: selesai1 })

      // Kontrak perpanjangan (aktif)
      const mulai2 = new Date(selesai1)
      mulai2.setDate(mulai2.getDate() + 1)
      const selesai2 = new Date(mulai2)
      selesai2.setMonth(selesai2.getMonth() + 6)
      contracts.push({ posisi, traineeSejak: mulai2, traineeSelesai: selesai2 })
    }

    const formConsent = Math.random() > 0.15 ? 'ADA' : 'TIDAK ADA'
    const hasNik = Math.random() > 0.3
    const hasJamsostek = Math.random() > 0.5

    await prisma.employee.create({
      data: {
        ba: cab.ba,
        baCabang: cab.baCabang,
        region: cab.region,
        cabang: cab.cabang,
        namaLengkap,
        status,
        nik: hasNik ? `NIK${pad(randInt(1, 999), 4)}${pad(i, 3)}` : null,
        noJamsostek: hasJamsostek ? `JST${randInt(10000000, 99999999)}` : null,
        noKtp: randomKtp(cab.ktp),
        tglLahir,
        namaIbu: pick(NAMA_IBU),
        noHp: randomPhone(),
        formConsent,
        departmentId,
        contracts: {
          create: contracts.map(c => ({
            posisi: c.posisi,
            traineeSejak: c.traineeSejak,
            traineeSelesai: c.traineeSelesai,
          })),
        },
      },
    })

    const statusEmoji = status === 'AKTIF' ? '🟢' : '🔴'
    process.stdout.write(`  ${statusEmoji} ${pad(i, 2)}/${TOTAL} ${namaLengkap.padEnd(28)} | ${cab.cabang.padEnd(14)} | ${posisi.padEnd(16)} | ${contracts.length} kontrak\n`)
  }

  // 4. Summary
  const totalEmp = await prisma.employee.count()
  const totalContract = await prisma.contract.count()
  const totalAktif = await prisma.employee.count({ where: { status: 'AKTIF' } })
  const totalDept = await prisma.department.count()

  console.log('\n' + '─'.repeat(60))
  console.log('📊 RINGKASAN SEED DATA:')
  console.log(`   👷 Karyawan  : ${totalEmp} (${totalAktif} aktif, ${totalEmp - totalAktif} tidak aktif)`)
  console.log(`   📄 Kontrak   : ${totalContract}`)
  console.log(`   🏢 Department: ${totalDept}`)
  console.log(`   👤 Users     : admin (ADMIN), viewer (VIEWER)`)
  console.log('─'.repeat(60))
  console.log('✅ Seed selesai!\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
