import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { updateEmployee } from '@/app/actions/employee';
import { EditKaryawanForm } from '@/components/edit-karyawan-form';
import { notFound } from 'next/navigation';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function EditKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) notFound();

  // Bind Server Action dengan ID
  const updateEmployeeWithId = updateEmployee.bind(null, id);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-10 font-sans">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink href={`/karyawan/${id}`}>Profil</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Edit Karyawan</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 bg-slate-50 p-8 font-sans">
        <div className="max-w-7xl mx-auto mb-6">
          <Link href={`/karyawan/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1 font-bold text-slate-600">
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
          </Link>
        </div>
        
        {/* Render Komponen Client */}
        <EditKaryawanForm 
          employee={employee} 
          updateAction={updateEmployeeWithId} 
        />
      </main>
    </>
  );
}