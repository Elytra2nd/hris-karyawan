'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addMonths } from 'date-fns';

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

  await prisma.employee.create({
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

  revalidatePath('/');
  redirect('/');
}

/**
 * Action untuk memperbarui data karyawan
 */
export async function updateEmployee(id: string, formData: FormData) {
  // ... (Logika pengambilan data dari formData tetap sama)
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
  const status = formData.get('status') as string; // Tambahkan update status Aktif/Out 

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

  revalidatePath('/');
  revalidatePath(`/karyawan/${id}`);
  redirect(`/karyawan/${id}`);
}

/**
 * Action untuk menambahkan kontrak baru (Renewal)
 */
export async function createContract(employeeId: string, formData: FormData) {
  const posisi = formData.get('posisi') as string;
  const traineeSejakRaw = formData.get('traineeSejak') as string;

  // Implementasi Otomatisasi Tanggal Selesai 
  const traineeSejak = new Date(traineeSejakRaw);
  const traineeSelesai = calculateEndDate(posisi, traineeSejak);

  await prisma.contract.create({
    data: {
      posisi,
      traineeSejak,
      traineeSelesai,
      employeeId: employeeId,
    },
  });

  revalidatePath(`/karyawan/${employeeId}`);
  revalidatePath('/');
  redirect(`/karyawan/${employeeId}`);
}

/**
 * Action untuk menghapus data karyawan
 * Perhatian: Secara otomatis menghapus riwayat kontrak (Cascade) 
 */
export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.delete({
      where: { id },
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: 'Gagal menghapus data karyawan' };
  }
}

export async function getAllEmployeesForExport() {
  try {
    const data = await prisma.employee.findMany({
      include: {
        contracts: {
          orderBy: { createdAt: 'desc' },
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