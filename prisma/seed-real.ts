/**
 * Seed Script — Data Asli dari Excel Bu Yanti (Form Trainee H730 Ok.xlsm)
 * 18 karyawan, 56 kontrak, cabang SAMBAS/PONTIANAK
 * 
 * Run: npx tsx prisma/seed-real.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';
import seedHistory from './seed-history.json';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'hris_karyawan',
});

const prisma = new PrismaClient({ adapter });

// Daftar nomor HP dummy yang realistis (karena Excel tidak punya data HP)
const phoneNumbers = [
  '081234567001', '081234567002', '081234567003', '081234567004',
  '081234567005', '081234567006', '081234567007', '081234567008',
  '081234567009', '081234567010', '081234567011', '081234567012',
  '081234567013', '081234567014', '081234567015', '081234567016',
  '081234567017', '081234567018', '081234567019', '081234567020',
];

async function main() {
  console.log('🗑️  Membersihkan data lama...');
  await prisma.contract.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // ============ 1. SETUP USERS ============
  console.log('👤 Membuat akun pengguna...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      username: 'viewer',
      password: viewerPassword,
      role: 'VIEWER',
    },
  });

  console.log('  ✅ Admin: admin / admin123');
  console.log('  ✅ Viewer: viewer / viewer123');

  // ============ 2. SEED KARYAWAN + KONTRAK ============
  console.log('\n📊 Memasukkan data karyawan dari Excel Bu Yanti...');

  const data = seedHistory as any[];
  let totalContracts = 0;

  for (let i = 0; i < data.length; i++) {
    const emp = data[i];
    
    // Tentukan cabang (baCabang) — dari data Excel
    const cabang = emp.baCabang || 'SAMBAS';
    
    // Sort contracts by date (oldest first)
    const sortedContracts = emp.contracts.sort(
      (a: any, b: any) => new Date(a.traineeSejak).getTime() - new Date(b.traineeSejak).getTime()
    );

    // Cek kontrak terakhir untuk menentukan status
    const latestContract = sortedContracts[sortedContracts.length - 1];
    const endDate = new Date(latestContract.traineeSelesai);
    const today = new Date();
    const status = endDate < today ? 'NON-AKTIF' : 'AKTIF';

    const created = await prisma.employee.create({
      data: {
        ba: emp.ba || 'H730',
        baCabang: cabang,
        region: emp.region || 'PONTIANAK',
        cabang: cabang,
        namaLengkap: emp.namaLengkap,
        status: status,
        nik: `H730-${String(i + 1).padStart(3, '0')}`,
        noJamsostek: null,
        noKtp: emp.noKtp,
        tglLahir: emp.tglLahir || '1990-01-01',
        namaIbu: emp.namaIbu || '-',
        noHp: phoneNumbers[i] || `0812345670${String(i + 1).padStart(2, '0')}`,
        formConsent: 'ADA',
        contracts: {
          create: sortedContracts.map((c: any) => ({
            posisi: c.posisi,
            traineeSejak: new Date(c.traineeSejak),
            traineeSelesai: new Date(c.traineeSelesai),
            contractPath: c.contractNumber || null,
          })),
        },
      },
    });

    totalContracts += sortedContracts.length;
    const icon = status === 'AKTIF' ? '🟢' : '🔴';
    console.log(`  ${icon} ${emp.namaLengkap} — ${sortedContracts.length} kontrak (${status})`);
  }

  // ============ 3. RINGKASAN ============
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Selesai!`);
  console.log(`   📋 ${data.length} karyawan`);
  console.log(`   📄 ${totalContracts} kontrak`);
  console.log(`   👤 2 user (admin + viewer)`);
  console.log('='.repeat(50));
  console.log('\n🔑 Login credentials:');
  console.log('   Admin  → admin / admin123');
  console.log('   Viewer → viewer / viewer123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
