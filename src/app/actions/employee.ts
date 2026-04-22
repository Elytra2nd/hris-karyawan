'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addMonths } from 'date-fns';
import { createAuditLog } from '@/lib/audit';
import { verifySession } from '@/lib/dal';

/**
 * Helper untuk menghitung tanggal selesai berdasarkan jabatan
 * Aturan Bisnis: Admin = 3 bulan, Lainnya = 6 bulan 
 */
function calculateEndDate(posisi: string, startDate: Date): Date {
  const isAdmin = posisi.toLowerCase().includes('admin');
  return isAdmin ? addMonths(startDate, 3) : addMonths(startDate, 6);
}

/**
 * Action untuk menambah karyawan baru
 */
export async function createEmployee(formData: FormData) {
  const session = await verifySession();
  
  const ba = formData.get('ba') as string;
  const baCabang = formData.get('baCabang') as string;
  const region = formData.get('region') as string;
  const cabang = formData.get('cabang') as string;
  const namaLengkap = formData.get('namaLengkap') as string;
  
  const nikRaw = formData.get('nik') as string;
  const nik = nikRaw?.trim() === '' ? null : nikRaw;
  
  const noJamsostekRaw = formData.get('noJamsostek') as string;
  const noJamsostek = noJamsostekRaw?.trim() === '' ? null : noJamsostekRaw;

  const noKtp = formData.get('noKtp') as string;
  const tglLahir = formData.get('tglLahir') as string;
  const namaIbu = formData.get('namaIbu') as string;
  const noHp = formData.get('noHp') as string;
  const formConsent = formData.get('formConsent') as string;

  const posisi = formData.get('posisi') as string;
  const traineeSejakRaw = formData.get('traineeSejak') as string;
  
  // Implementasi Otomatisasi Tanggal Selesai 
  const traineeSejak = new Date(traineeSejakRaw);
  const traineeSelesai = calculateEndDate(posisi, traineeSejak);

  const newEmployee = await prisma.employee.create({
    data: {
      ba,
      baCabang,
      region,
      cabang,
      namaLengkap,
      status: 'AKTIF',
      nik,
      noJamsostek,
      noKtp,
      tglLahir, 
      namaIbu,
      noHp,
      formConsent,
      contracts: {
        create: {
          posisi,
          traineeSejak,
          traineeSelesai,
        },
      },
    },
  });

  // CATAT KE AUDIT LOG
  await createAuditLog(
    session.id,
    session.username,
    'CREATE',
    'employee',
    newEmployee.id,
    { nama: namaLengkap, cabang: cabang, posisi: posisi }
  );

  revalidatePath('/');
  redirect('/');
}

/**
 * Action untuk memperbarui data karyawan
 */
export async function updateEmployee(id: string, formData: FormData) {
  const session = await verifySession();

  const ba = formData.get('ba') as string;
  const baCabang = formData.get('baCabang') as string;
  const region = formData.get('region') as string;
  const cabang = formData.get('cabang') as string;
  const namaLengkap = formData.get('namaLengkap') as string;
  
  const nikRaw = formData.get('nik') as string;
  const nik = nikRaw?.trim() === '' ? null : nikRaw;
  
  const noJamsostekRaw = formData.get('noJamsostek') as string;
  const noJamsostek = noJamsostekRaw?.trim() === '' ? null : noJamsostekRaw;

  const noKtp = formData.get('noKtp') as string;
  const tglLahir = formData.get('tglLahir') as string;
  const namaIbu = formData.get('namaIbu') as string;
  const noHp = formData.get('noHp') as string;
  const formConsent = formData.get('formConsent') as string;
  const status = formData.get('status') as string;

  await prisma.employee.update({
    where: { id },
    data: {
      ba,
      baCabang,
      region,
      cabang,
      namaLengkap,
      status, 
      nik,
      noJamsostek,
      noKtp,
      tglLahir,
      namaIbu,
      noHp,
      formConsent,
    },
  });

  // CATAT KE AUDIT LOG
  await createAuditLog(
    session.id,
    session.username,
    'UPDATE',
    'employee',
    id,
    { 
        updatedFields: Array.from(formData.keys()).filter(key => key !== 'id'),
        statusTarget: status 
    }
  );

  revalidatePath('/');
  revalidatePath(`/karyawan/${id}`);
  redirect(`/karyawan/${id}`);
}

/**
 * Action untuk menambahkan kontrak baru (Renewal)
 */
export async function createContract(employeeId: string, formData: FormData) {
  const session = await verifySession();
  const posisi = formData.get('posisi') as string;
  const traineeSejakRaw = formData.get('traineeSejak') as string;

  // Implementasi Otomatisasi Tanggal Selesai 
  const traineeSejak = new Date(traineeSejakRaw);
  const traineeSelesai = calculateEndDate(posisi, traineeSejak);

  const newContract = await prisma.contract.create({
    data: {
      posisi,
      traineeSejak,
      traineeSelesai,
      employeeId: employeeId,
    },
  });

  // CATAT KE AUDIT LOG
  await createAuditLog(
    session.id,
    session.username,
    'CREATE',
    'contract',
    newContract.id,
    { employeeId: employeeId, posisBaru: posisi }
  );

  revalidatePath(`/karyawan/${employeeId}`);
  revalidatePath('/');
  redirect(`/karyawan/${employeeId}`);
}

/**
 * Action untuk menghapus data karyawan
 */
export async function deleteEmployee(id: string) {
  const session = await verifySession();
  try {
    // Ambil data nama sebelum dihapus untuk record audit
    const employeeData = await prisma.employee.findUnique({
      where: { id },
      select: { namaLengkap: true }
    });

    await prisma.employee.delete({
      where: { id },
    });
    
    // CATAT KE AUDIT LOG
    await createAuditLog(
      session.id,
      session.username,
      'DELETE',
      'employee',
      id,
      { namaTerhapus: employeeData?.namaLengkap || 'Unknown' }
    );

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: 'Gagal menghapus data karyawan' };
  }
}

/**
 * Ambil semua data untuk export (Tanpa Log karena hanya Read)
 */
export async function getAllEmployeesForExport() {
  try {
    const data = await prisma.employee.findMany({
      include: {
        contracts: {
          orderBy: { traineeSelesai: 'desc' },
          take: 1
        }
      },
      orderBy: { namaLengkap: 'asc' }
    });
    return data;
  } catch (error) {
    console.error("Export Error:", error);
    return [];
  }
}

/**
 * Ambil data karyawan dengan filter (Tanpa Log karena hanya Read)
 */
export async function getEmployees({ 
  search = '', 
  cabang = '', 
  status = '' 
}) {
  try {
    const data = await prisma.employee.findMany({
      where: {
        AND: [
          {
            OR: [
              { namaLengkap: { contains: search } },
              { nik: { contains: search } },
            ],
          },
          cabang ? { cabang: cabang } : {},
          status ? { status: status } : {},
        ],
      },
      include: {
        contracts: {
          orderBy: { traineeSelesai: 'desc' },
          take: 1
        }
      },
      orderBy: { namaLengkap: 'asc' }
    });
    return data;
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}