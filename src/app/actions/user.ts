'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { verifySession } from '@/lib/dal';

export async function getUsers() {
  const session = await verifySession();
  if (session.role !== 'ADMIN') return [];
  
  return await prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createUser(formData: FormData) {
  const session = await verifySession();
  if (session.role !== 'ADMIN') throw new Error("Unauthorized");

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      username,
      password: hashedPassword,
      role
    }
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await verifySession();
  if (session.role !== 'ADMIN') throw new Error("Unauthorized");

  // Cegah admin menghapus dirinya sendiri
  if (session.id === id) {
    return { success: false, error: "Tidak bisa menghapus akun sendiri." };
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
  return { success: true };
}