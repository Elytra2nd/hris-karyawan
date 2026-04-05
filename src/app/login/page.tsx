import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/login-form';

export default async function LoginPage() {
  // Mengecek apakah pengguna sudah memiliki sesi aktif
  const session = await getServerSession(authOptions);

  if (session) {
    // Jika sudah login, paksa kembali ke beranda
    redirect('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <LoginForm />
    </main>
  );
}