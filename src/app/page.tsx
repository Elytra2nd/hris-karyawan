import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { startOfDay, addDays } from 'date-fns';
import EmployeeTable from '@/components/employee-table';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { DashboardShell } from '@/components/dashboard-shell';
import { StatCards } from '@/components/stat-cards';
import { EmployeeChart } from '@/components/employee-chart';
import { ContractStatusChart } from '@/components/contract-status-chart';
import { RegionChart } from '@/components/region-chart'; 
import { RiskAlert } from '@/components/risk-alert';     
import { Card, CardContent } from '@/components/ui/card';
import { TableProperties, BarChart3, Users } from 'lucide-react';

// Menambahkan interface untuk searchParams agar Next.js mengenali query di URL
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const user = await verifySession();
  
  // Konfigurasi Paginasi
  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 10; // Menampilkan 10 data per halaman

  const today = startOfDay(new Date());
  const thirtyDaysFromNow = addDays(today, 30);

  // 1. Fetching Data Karyawan dengan Paginasi & Total Data
  const [employees, totalEmployees] = await Promise.all([
    prisma.employee.findMany({
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        contracts: {
          orderBy: { traineeSejak: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count(),
  ]);

  const totalPages = Math.ceil(totalEmployees / itemsPerPage);

  // 2. Data Statistik (Dashboard Analytics)
  const statsPosisi = await prisma.contract.groupBy({
    by: ['posisi'],
    _count: { posisi: true },
    orderBy: { _count: { posisi: 'desc' } },
  });

  const statsCabang = await prisma.employee.groupBy({
    by: ['cabang'],
    _count: { cabang: true },
    orderBy: { _count: { cabang: 'desc' } },
    take: 5,
  });

  const expiringSoonCount = await prisma.contract.count({
    where: {
      traineeSelesai: { gte: today, lte: thirtyDaysFromNow },
      employee: { status: 'AKTIF' }
    },
  });

  const totalKontrak = statsPosisi.reduce((acc, curr) => acc + curr._count.posisi, 0);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbPage className="font-extrabold text-slate-900 tracking-tighter uppercase">
              HRIS Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
      </header>

      <main className="flex-1 p-6 bg-slate-50 space-y-6">
        <DashboardShell>
          <div className="space-y-8">
            
            {/* BARIS 1: RINGKASAN PANEL - TINGGI & LEBAR SERAGAM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              
              {/* 1. Profil User */}
              <div className="h-28">
                <StatCards user={user} type="profile" />
              </div>
              
              {/* 2. Mitigasi Risiko */}
              <div className="h-28">
                <RiskAlert count={expiringSoonCount} />
              </div>

              {/* 3. Total Karyawan */}
              <div className="h-28">
                <Card className="border-none shadow-sm bg-blue-700 text-white overflow-hidden relative h-full border-l-4 border-l-blue-900">
                  <CardContent className="p-4 flex items-center gap-4 h-full relative z-10">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 leading-none mb-1.5">Total Database</p>
                      <h3 className="text-2xl font-black tracking-tighter leading-none">{totalKontrak} Entri</h3>
                      <span className="text-[9px] font-medium opacity-50 uppercase mt-1 block">Data Terverifikasi</span>
                    </div>
                  </CardContent>
                  <BarChart3 className="absolute -right-2 -top-2 w-16 h-16 text-white opacity-10 -rotate-12" />
                </Card>
              </div>

              {/* 4. Manajemen Data (Aksi Cepat) */}
              <div className="h-28">
                <StatCards user={user} type="actions" />
              </div>
            </div>

            {/* BARIS 2: ANALYTICS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch pt-2">
              <div className="lg:col-span-1">
                <RegionChart data={statsCabang} title="Sebaran Cabang" />
              </div>
              <div className="lg:col-span-2">
                <EmployeeChart data={statsPosisi} />
              </div>
              <div className="lg:col-span-1">
                <ContractStatusChart data={statsPosisi} />
              </div>
            </div>

          </div>
        </DashboardShell>

        {/* Section Tabel dengan Paginasi */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 bg-blue-600 rounded-full" />
            <TableProperties className="w-4 h-4 text-slate-800" />
            <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Database Karyawan</h2>
          </div>
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {/* Mengirimkan data hasil fetch prisma ke EmployeeTable */}
              <EmployeeTable 
                data={employees} 
                currentPage={currentPage} 
                totalPages={totalPages} 
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}