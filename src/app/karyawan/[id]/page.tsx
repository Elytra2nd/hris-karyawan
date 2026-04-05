import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, ChevronLeft } from 'lucide-react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function DetailKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      contracts: { orderBy: { traineeSejak: 'desc' } },
    },
  });

  if (!employee) notFound();

  // --- LOGIKA KALKULASI AKUMULASI MASA KERJA ---
  const totalMonths = employee.contracts.reduce((acc, curr) => {
    const start = new Date(curr.traineeSejak);
    const end = new Date(curr.traineeSelesai);
    return acc + differenceInMonths(end, start);
  }, 0);

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const akumulasiTeks = `${years > 0 ? `${years} Tahun ` : ""}${months} Bulan`;

  // --- LOGIKA WARNING KONTRAK TERAKHIR ---
  const latestContract = employee.contracts[0];
  const daysToExpiry = latestContract 
    ? differenceInDays(new Date(latestContract.traineeSelesai), new Date()) 
    : null;

  return (
    <>
      {/* Header Dinamis dengan Sidebar Trigger & Breadcrumb */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Profil Karyawan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 bg-slate-50 p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Kembali
                </Button>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                {employee.namaLengkap}
              </h1>
            </div>
            <div className="flex gap-2">
              <Link href={`/karyawan/${id}/edit`}>
                <Button variant="secondary">Edit Profil</Button>
              </Link>
              <Link href={`/karyawan/${id}/kontrak`}>
                <Button>+ Perbarui Kontrak</Button>
              </Link>
            </div>
          </div>

          {/* Info Akumulasi Masa Kerja & Warning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-100 shadow-sm">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="text-blue-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Total Masa Kerja</p>
                  <p className="text-xl font-bold text-blue-900">{akumulasiTeks}</p>
                </div>
              </CardContent>
            </Card>

            {latestContract && (
              <Card className={`${daysToExpiry! <= 30 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"} shadow-sm`}>
                <CardContent className="pt-6 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${daysToExpiry! <= 30 ? "bg-red-100" : "bg-green-100"}`}>
                    <CalendarDays className={`h-5 w-5 ${daysToExpiry! <= 30 ? "text-red-600" : "text-green-600"}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${daysToExpiry! <= 30 ? "text-red-600" : "text-green-600"}`}>
                      Status Kontrak Terakhir
                    </p>
                    <p className={`text-xl font-bold ${daysToExpiry! <= 30 ? "text-red-900" : "text-green-900"}`}>
                      {daysToExpiry! > 0 ? `${daysToExpiry} Hari Lagi` : "Masa Kontrak Habis"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Identitas */}
            <Card className="border-none shadow-sm">
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
                  <span className="text-slate-500">NIK</span>
                  <span className="col-span-2 font-medium">{employee.nik || '-'}</span>
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
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Jamsostek</span>
                  <span className="col-span-2">{employee.noJamsostek || '-'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card Operasional */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800">Data Wilayah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-3 border-b pb-2">
                  <span className="text-slate-500">Unit BA</span>
                  <span className="col-span-2 font-semibold text-blue-700">{employee.ba}</span>
                </div>
                <div className="grid grid-cols-3 border-b pb-2">
                  <span className="text-slate-500">Cabang BA</span>
                  <span className="col-span-2 font-medium">{employee.baCabang}</span>
                </div>
                <div className="grid grid-cols-3 border-b pb-2">
                  <span className="text-slate-500">Region</span>
                  <span className="col-span-2">{employee.region}</span>
                </div>
                <div className="grid grid-cols-3 border-b pb-2">
                  <span className="text-slate-500">Nama Cabang</span>
                  <span className="col-span-2">{employee.cabang}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-slate-500">Consent</span>
                  <span className="col-span-2">
                    <Badge variant="outline" className="font-normal">{employee.formConsent}</Badge>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabel Riwayat Kontrak */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-b">
              <CardTitle className="text-lg">Riwayat Masa Kontrak</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Jabatan</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Mulai</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Selesai</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 uppercase text-[10px] tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employee.contracts.map((contract, index) => {
                    const isExpired = new Date(contract.traineeSelesai) < new Date();
                    return (
                      <tr key={contract.id} className="border-b last:border-0 hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{contract.posisi}</td>
                        <td className="px-6 py-4 text-slate-600">{format(new Date(contract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}</td>
                        <td className="px-6 py-4 text-slate-600">{format(new Date(contract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}</td>
                        <td className="px-6 py-4">
                          {index === 0 && !isExpired ? (
                            <Badge className="bg-green-600 hover:bg-green-600 shadow-none border-none">Kontrak Aktif</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 border-slate-200 shadow-none font-normal">Selesai</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}