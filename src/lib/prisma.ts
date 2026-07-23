import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'hris_karyawan',
    // Pool aplikasi: 1 koneksi = semua request antre di belakang query paling
    // lambat (impor besar membekukan login). 10 aman untuk deployment
    // single-instance ini; naikkan bersama max_connections MariaDB kalau perlu.
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
  })

  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma