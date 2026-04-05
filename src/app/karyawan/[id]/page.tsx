import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Di Next.js 15, params harus di-await
export default async function DetailKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  
  const { id } = await params;

  // Cari data karyawan beserta seluruh riwayat kontraknya
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      contracts: {
        orderBy: { traineeSejak: 'desc' }, // Urutkan dari kontrak terbaru
      },
    },
  });

  // Jika ID tidak ditemukan di database, tampilkan halaman 404
  if (!employee) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">Kembali</Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Profil Karyawan
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">Edit Data</Button>
            <Button>+ Tambah Kontrak</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Identitas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Identitas Diri
                <Badge variant={employee.status === 'AKTIF' ? 'default' : 'destructive'}>
                  {employee.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Nama Lengkap</span>
                <span className="col-span-2 font-medium">{employee.namaLengkap}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">NIK</span>
                <span className="col-span-2">{employee.nik || '-'}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">No. KTP</span>
                <span className="col-span-2">{employee.noKtp}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Tanggal Lahir</span>
                <span className="col-span-2">{format(new Date(employee.tglLahir), 'dd MMMM yyyy', { locale: localeID })}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Nama Ibu</span>
                <span className="col-span-2">{employee.namaIbu}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">No. HP</span>
                <span className="col-span-2">{employee.noHp}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Jamsostek</span>
                <span className="col-span-2">{employee.noJamsostek || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card Operasional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Operasional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">BA</span>
                <span className="col-span-2 font-medium">{employee.ba}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">BA Cabang</span>
                <span className="col-span-2 font-medium">{employee.baCabang}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Region</span>
                <span className="col-span-2">{employee.region}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Cabang</span>
                <span className="col-span-2">{employee.cabang}</span>
              </div>
              <div className="grid grid-cols-3 border-b pb-2">
                <span className="text-slate-500">Form Consent</span>
                <span className="col-span-2">{employee.formConsent}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Riwayat Kontrak */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Kontrak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Posisi</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Mulai Kontrak</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Selesai Kontrak</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.contracts.map((contract) => (
                    <tr key={contract.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3">{contract.posisi}</td>
                      <td className="px-4 py-3">{format(new Date(contract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}</td>
                      <td className="px-4 py-3">{format(new Date(contract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}