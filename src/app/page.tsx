import { verifySession } from '@/lib/dal';
import LogoutButton from '@/components/logout-button';
import EmployeeTable from '@/components/employee-table'; // 1. Import komponen tabel
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6"> {/* max-w-4xl diubah jadi 6xl agar tabel muat */}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Dashboard HRIS
            </h1>
            <p className="text-slate-500">
              Selamat datang kembali, {user.username}!
            </p>
          </div>
          <LogoutButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Sesi Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className="font-semibold w-24">Username</span>
                <span>: {user.username}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-24">Hak Akses</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                  {user.role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Panggil komponen tabel di sini */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Data Karyawan</h2>
            {/* Tombol tambah data */}
            {user.role === 'ADMIN' && (
            <Link href="/karyawan/tambah">
                <Button>+ Tambah Karyawan</Button>
            </Link>
            )}
          </div>
          
          <EmployeeTable />
        </div>

      </div>
    </main>
  );
}