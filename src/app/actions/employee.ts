'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createEmployee(formData: FormData) {
  // 1. Ambil data dari form dan sesuaikan dengan tipe di Prisma
  const ba = formData.get('ba') as string;
  const baCabang = formData.get('baCabang') as string;
  const region = formData.get('region') as string;
  const cabang = formData.get('cabang') as string;
  const namaLengkap = formData.get('namaLengkap') as string;
  
  // Opsional (Bisa null jika kosong)
  const nikRaw = formData.get('nik') as string;
  const nik = nikRaw.trim() === '' ? null : nikRaw;
  
  const noJamsostekRaw = formData.get('noJamsostek') as string;
  const noJamsostek = noJamsostekRaw.trim() === '' ? null : noJamsostekRaw;

  // Wajib
  const noKtp = formData.get('noKtp') as string;
  const tglLahir = formData.get('tglLahir') as string;
  const namaIbu = formData.get('namaIbu') as string;
  const noHp = formData.get('noHp') as string;
  const formConsent = formData.get('formConsent') as string;

  // Data Kontrak
  const posisi = formData.get('posisi') as string;
  const traineeSejak = formData.get('traineeSejak') as string;
  const traineeSelesai = formData.get('traineeSelesai') as string;

  // 2. Simpan ke database
  await prisma.employee.create({
    data: {
      ba,
      baCabang,
      region,
      cabang,
      namaLengkap,
      status: 'AKTIF', // Default saat create
      nik,
      noJamsostek,
      noKtp,
      tglLahir, // Di schema berupa String
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