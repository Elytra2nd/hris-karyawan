'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  const traineeSejak = formData.get('traineeSejak') as string;
  const traineeSelesai = formData.get('traineeSelesai') as string;

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
          traineeSejak: new Date(traineeSejak),
          traineeSelesai: new Date(traineeSelesai),
        },
      },
    },
  });

  revalidatePath('/');
  redirect('/');
}

/**
 * Action untuk memperbarui data karyawan (Hanya Identitas & Operasional)
 */
export async function updateEmployee(id: string, formData: FormData) {
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

  await prisma.employee.update({
    where: { id },
    data: {
      ba,
      baCabang,
      region,
      cabang,
      namaLengkap,
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
 * Action untuk menambahkan kontrak baru pada karyawan yang sudah ada
 */
export async function createContract(employeeId: string, formData: FormData) {
  const posisi = formData.get('posisi') as string;
  const traineeSejak = formData.get('traineeSejak') as string;
  const traineeSelesai = formData.get('traineeSelesai') as string;

  await prisma.contract.create({
    data: {
      posisi,
      traineeSejak: new Date(traineeSejak),
      traineeSelesai: new Date(traineeSelesai),
      employeeId: employeeId,
    },
  });

  // Revalidasi halaman detail agar tabel riwayat kontrak langsung terupdate
  revalidatePath(`/karyawan/${employeeId}`);
  redirect(`/karyawan/${employeeId}`);
}