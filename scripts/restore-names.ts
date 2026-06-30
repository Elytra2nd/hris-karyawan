/**
 * Kembalikan nama lengkap karyawan ke nama realistis (cocok gender).
 * Hanya kolom namaLengkap yang diubah — kontrak, KTP, dll tidak disentuh.
 * Jalankan: npx tsx --env-file=.env scripts/restore-names.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hris_karyawan',
})
const prisma = new PrismaClient({ adapter })

const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)]

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

async function main() {
  const employees = await prisma.employee.findMany({ select: { id: true, gender: true } })
  console.log(`✏️  Mengembalikan nama ${employees.length} karyawan...`)

  let i = 0
  for (const e of employees) {
    const depan = e.gender === 'P' ? pick(NAMA_DEPAN_P) : pick(NAMA_DEPAN_L)
    const namaLengkap = `${depan} ${pick(NAMA_BELAKANG)}`
    await prisma.employee.update({ where: { id: e.id }, data: { namaLengkap } })
    i++
  }

  console.log(`✅ Selesai. ${i} karyawan kini bernama realistis kembali.`)
}

main()
  .catch((e) => { console.error('❌ Gagal:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
