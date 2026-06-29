import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import bcrypt from 'bcryptjs';

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hris_karyawan',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Setup Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Akun Admin siap!');

  // 1.2 Setup Positions
  console.log('💼 Membuat data posisi...');
  const posisiData = [
    { name: 'SALESMAN', contractMonths: 6 },
    { name: 'ADMIN', contractMonths: 3 },
    { name: 'STAFF IT', contractMonths: 6 },
    { name: 'DRIVER', contractMonths: 6 },
    { name: 'ACCOUNTING', contractMonths: 6 },
    { name: 'SECURITY', contractMonths: 6 },
  ];
  for (const p of posisiData) {
    await prisma.position.upsert({
      where: { name: p.name },
      update: { contractMonths: p.contractMonths },
      create: p,
    });
  }

  // 1.5 Setup Branches
  console.log('🏛️ Membuat data cabang...');
  const cabangDummies = ['PONTIANAK', 'JAKARTA', 'MEDAN', 'SURABAYA', 'MAKASSAR', 'BALIKPAPAN'];
  for (const c of cabangDummies) {
    await prisma.branch.upsert({
      where: { code: c },
      update: {},
      create: {
        code: c,
        label: `Cabang ${c}`,
      },
    });
  }

  // 2. Daftar Variasi Data untuk Looping
  const namaDummies = [
    'Budi', 'Siti', 'Andi', 'Dewi', 'Eko', 'Rina', 'Fajar', 'Maya', 'Gani', 'Lia',
    'Heri', 'Sari', 'Iwan', 'Dina', 'Joko', 'Yanti', 'Kiki', 'Nana', 'Lutfi', 'Ani'
  ];
  const posisiDummies = ['SALESMAN', 'ADMIN', 'STAFF IT', 'DRIVER', 'ACCOUNTING', 'SECURITY'];
  const regionMap: Record<string, string> = {
    'PONTIANAK': 'KALIMANTAN', 'BALIKPAPAN': 'KALIMANTAN',
    'JAKARTA': 'JAWA', 'SURABAYA': 'JAWA',
    'MEDAN': 'SUMATERA', 'MAKASSAR': 'SULAWESI'
  };

  console.log('⏳ Memasukkan 50 data dummy karyawan...');

  for (let i = 1; i <= 50; i++) {
    const namaRandom = namaDummies[Math.floor(Math.random() * namaDummies.length)];
    const cabangRandom = cabangDummies[Math.floor(Math.random() * cabangDummies.length)];
    const posisiRandom = posisiDummies[Math.floor(Math.random() * posisiDummies.length)];
    
    // Logika Tanggal: Ada yang expired, ada yang masih lama
    const tglMulai = new Date();
    tglMulai.setMonth(tglMulai.getMonth() - Math.floor(Math.random() * 6)); // 0-6 bulan lalu
    
    const tglSelesai = new Date();
    // Random 20 hari ke depan (untuk trigger Mitigasi Risiko) sampai 1 tahun ke depan
    tglSelesai.setDate(tglSelesai.getDate() + (Math.floor(Math.random() * 300) - 10));

    await prisma.employee.create({
      data: {
        ba: `BA0${Math.floor(Math.random() * 9) + 1}`,
        baCabang: `BC0${Math.floor(Math.random() * 9) + 1}`,
        region: regionMap[cabangRandom],
        cabang: cabangRandom,
        namaLengkap: `${namaRandom} ${['Pratama', 'Wijaya', 'Santoso', 'Kurniawan', 'Putri'][Math.floor(Math.random() * 5)]} ${i}`,
        status: 'AKTIF',
        noKtp: `6171${Math.random().toString().slice(2, 14)}`,
        tglLahir: new Date('1990-01-01'),
        namaIbu: 'Ibu Kandung',
        noHp: `08${Math.random().toString().slice(2, 12)}`,
        formConsent: Math.random() > 0.2 ? 'ADA' : 'TIDAK ADA',
        contracts: {
          create: {
            posisi: posisiRandom,
            traineeSejak: tglMulai,
            traineeSelesai: tglSelesai,
          }
        }
      }
    });
  }

  console.log('✅ 50 Data dummy berhasil dimasukkan!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });