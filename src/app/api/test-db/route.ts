import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  const testResults: any = {};

  try {
    // 1. TEST KONEKSI DATABASE
    const userCount = await prisma.user.count();
    testResults.database_connection = "OK";
    testResults.user_count = userCount;

    // 2. TEST OPERASI CRUD KARYAWAN
    const tempEmployee = await prisma.employee.create({
      data: {
        namaLengkap: "TEST KARYAWAN",
        ba: "TEST",
        baCabang: "TEST",
        region: "KALIMANTAN",
        cabang: "PONTIANAK",
        noKtp: "0000000000",
        tglLahir: "1990-01-01",
        namaIbu: "IBU TEST",
        noHp: "08000000",
        formConsent: "ADA"
      }
    });
    testResults.create_record = `SUCCESS (ID: ${tempEmployee.id})`;

    // 3. TEST SISTEM FILE (UPLOAD MOCK)
    const testFolder = join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(testFolder, { recursive: true });
    
    const testFilePath = join(testFolder, `test_file_${tempEmployee.id}.txt`);
    await writeFile(testFilePath, "Koneksi sistem file PT. Multi Makmur OK");
    testResults.file_write = "OK (File tercipta di public/uploads/profiles)";

    // 4. CLEANUP (Hapus kembali data test)
    await unlink(testFilePath);
    await prisma.employee.delete({ where: { id: tempEmployee.id } });
    testResults.cleanup = "OK (Data & File dummy telah dibersihkan)";

    return NextResponse.json({ status: "ALL SYSTEMS GO", results: testResults });

  } catch (error: any) {
    return NextResponse.json({ 
      status: "FAILED", 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}