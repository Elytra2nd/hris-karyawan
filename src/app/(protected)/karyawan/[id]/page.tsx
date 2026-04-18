import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { differenceInMonths, differenceInDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, ChevronLeft, UserCircle2, MapPin, Contact2, Pencil, PlusCircle } from 'lucide-react';
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

// Import Komponen List Karyawan (Client Component)
import { ContractList } from '@/components/contract-list';

export default async function DetailKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  // Ambil session untuk mengecek role
  const session = await verifySession();
  const { id } = await params;

  // Cek apakah user adalah Admin
  const isAdmin = session?.role === 'ADMIN';

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      contracts: { orderBy: { traineeSejak: 'desc' } },
    },
  });

  if (!employee) notFound();

  // --- LOGIKA KALKULASI ---
  const totalMonths = employee.contracts.reduce((acc, curr) => {
    const start = new Date(curr.traineeSejak);
    const end = new Date(curr.traineeSelesai);
    return acc + differenceInMonths(end, start);
  }, 0);

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const akumulasiTeks = `${years > 0 ? `${years} Tahun ` : ""}${months} Bulan`;

  const latestContract = employee.contracts[0];
  const daysToExpiry = latestContract 
    ? differenceInDays(new Date(latestContract.traineeSelesai), new Date()) 
    : 0;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10 font-sans">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Profil Karyawan</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 bg-slate-50 p-6 md:p-8 space-y-6 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* TOP BAR: Navigasi & Aksi */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link href="/karyawan">
              <Button variant="ghost" size="sm" className="gap-2 font-bold text-slate-500 hover:text-slate-900">
                <ChevronLeft className="h-4 w-4" /> Kembali ke Database
              </Button>
            </Link>

            {/* ACTION BUTTONS: Hanya muncul jika Role = ADMIN */}
            {isAdmin && (
              <div className="flex gap-2">
                <Link href={`/karyawan/${id}/edit`}>
                  <Button variant="outline" className="gap-2 border-slate-200 font-bold uppercase text-[11px] tracking-wider shadow-none">
                    <Pencil className="w-3.5 h-3.5" /> Edit Profil
                  </Button>
                </Link>
                <Link href={`/karyawan/${id}/kontrak`}>
                  <Button className="gap-2 bg-blue-700 hover:bg-blue-800 font-bold uppercase text-[11px] tracking-wider shadow-lg shadow-blue-100">
                    <PlusCircle className="w-3.5 h-3.5" /> Perbarui Kontrak
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* PROFIL CARD (Identitas Utama) */}
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-slate-100 border-4 border-slate-50 shadow-inner shrink-0">
                  {employee.image ? (
                    <img src={employee.image} alt={employee.namaLengkap} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <UserCircle2 className="w-20 h-20" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">{employee.namaLengkap}</h1>
                    <Badge className={employee.status === 'AKTIF' ? 'bg-emerald-500 shadow-none' : 'bg-red-500 shadow-none'}>
                      {employee.status}
                    </Badge>
                    {/* Badge Role Indicator */}
                    {!isAdmin && (
                      <Badge variant="outline" className="text-slate-400 border-slate-200">
                        Mode Viewer
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 uppercase tracking-tighter">
                      <Contact2 className="w-4 h-4 text-slate-400" /> NIK: {employee.nik || 'Belum Terdaftar'}
                    </div>
                    <div className="flex items-center gap-1.5 uppercase tracking-tighter">
                      <MapPin className="w-4 h-4 text-slate-400" /> {employee.cabang} ({employee.ba})
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 border-t bg-slate-50/50">
                <div className="p-4 flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-100">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Clock className="h-5 w-5" /></div>
                  <div>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest leading-none mb-1">Masa Kerja Akumulasi</p>
                    <p className="text-lg font-black text-blue-900 leading-none">{akumulasiTeks}</p>
                  </div>
                </div>
                <div className={`p-4 flex items-center gap-4 ${daysToExpiry <= 30 ? "bg-red-50/50" : "bg-emerald-50/50"}`}>
                  <div className={`p-2 rounded-lg ${daysToExpiry <= 30 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}><CalendarDays className="h-5 w-5" /></div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${daysToExpiry <= 30 ? "text-red-600" : "text-emerald-600"}`}>Sisa Kontrak Terakhir</p>
                    <p className={`text-lg font-black leading-none ${daysToExpiry <= 30 ? "text-red-900" : "text-emerald-900"}`}>{daysToExpiry > 0 ? `${daysToExpiry} Hari` : "Habis"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIWAYAT KONTRAK */}
          <ContractList 
            employee={employee} 
            contracts={employee.contracts} 
          />
          
        </div>
      </main>
    </>
  );
}