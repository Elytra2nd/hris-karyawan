import { verifySession } from '@/lib/dal';
import { createEmployee } from '@/app/actions/employee';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { EmployeeForm } from '@/components/employee-form';

export default async function TambahKaryawanPage() {
  await verifySession();

  return (
    <>
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
              <BreadcrumbPage>Tambah Karyawan</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <main className="flex-1 bg-slate-50 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Tambah Karyawan Baru</CardTitle>
              <CardDescription>
                Input identitas diri dan masa kontrak awal sesuai aturan jabatan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeForm action={createEmployee} />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}