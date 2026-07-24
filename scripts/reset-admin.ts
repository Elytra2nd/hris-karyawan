/**
 * Buat / reset akun admin pada DB yang ditunjuk oleh env (DB_HOST dst).
 * Jalankan DI SERVER PROD (dengan .env prod):
 *   npx tsx --env-file=.env scripts/reset-admin.ts
 * Opsional set password lewat env: ADMIN_PASSWORD=Rahasia123 npx tsx ...
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

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'Admin123'
  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hash, role: 'ADMIN' },
    create: { username, password: hash, role: 'ADMIN' },
  })

  console.log(`✅ Akun admin siap di DB "${process.env.DB_NAME}" @ ${process.env.DB_HOST}`)
  console.log(`   username : ${user.username}`)
  console.log(`   password : ${password}`)
  console.log(`   role     : ${user.role}`)
  console.log('   (login memakai password di atas — perhatikan huruf besar/kecil)')
}

main()
  .catch((e) => { console.error('❌ Gagal:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
