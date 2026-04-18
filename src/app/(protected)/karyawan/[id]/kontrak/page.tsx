import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { createContract } from '@/app/actions/employee';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ContractForm } from '@/components/contract-form';
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
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default async function TambahKontrakPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  // Mengambil data karyawan untuk konteks visual pengguna
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { namaLengkap: true }
  });

  if (!employee) notFound();

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
              <BreadcrumbLink href={`/karyawan/${id}`}>Profil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tambah Kontrak</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 bg-slate-50 p-8 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Navigasi & Judul */}
          <div className="flex items-center gap-4">
            <Link href={`/karyawan/${id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Batal
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tambah Kontrak Baru
            </h1>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Detail Kontrak Baru</CardTitle>
              <CardDescription>
                Menerbitkan masa kontrak baru untuk: <span className="font-semibold text-slate-900 uppercase">{employee.namaLengkap}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractForm 
                employeeId={id} 
                action={createContract} 
              />
            </CardContent>
          </Card>

          {/* Info Aturan Bisnis (Perbaikan Hydration Error: Menggunakan <div> bukan <p>) */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm text-amber-800">
              <strong className="block mb-2">Catatan Aturan Kontrak:</strong>
              <ul className="list-disc ml-5 space-y-1">
                <li>Jabatan <strong>ADMINISTRASI</strong>: Otomatis diset 3 bulan.</li>
                <li>Jabatan lainnya: Otomatis diset 6 bulan.</li>
              </ul>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}