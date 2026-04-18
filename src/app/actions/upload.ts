'use server';

import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function uploadEmployeePhoto(formData: FormData, employeeId: string) {
  try {
    const file = formData.get('file') as File;
    if (!file || file.size === 0) throw new Error("File tidak valid");

    // 1. Validasi Tipe File (Hanya Gambar)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: "Hanya format JPG, PNG, atau WEBP yang diizinkan" };
    }

    // 2. Ambil data lama untuk hapus foto lama (Cleanup)
    const oldEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { image: true }
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadDir, { recursive: true });

    // Nama file unik
    const fileName = `${employeeId}_${Date.now()}.${file.name.split('.').pop()}`;
    const fullPath = join(uploadDir, fileName);

    // 3. Simpan file baru
    await writeFile(fullPath, buffer);

    // 4. Update Database
    const relativePath = `/uploads/profiles/${fileName}`;
    await prisma.employee.update({
      where: { id: employeeId },
      data: { image: relativePath }
    });

    // 5. Hapus Foto Lama dari Storage (Jika ada dan bukan file yang sama)
    if (oldEmployee?.image) {
      const oldFilePath = join(process.cwd(), 'public', oldEmployee.image);
      try {
        await unlink(oldFilePath);
      } catch (e) {
        console.log("Foto lama tidak ditemukan, skipping cleanup...");
      }
    }

    revalidatePath(`/karyawan/${employeeId}`);
    return { success: true, url: relativePath };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, message: "Gagal memproses unggahan" };
  }
}