import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { createContract } from '@/app/actions/employee';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function TambahKontrakPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  // Ambil nama karyawan untuk ditampilkan di header
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: { namaLengkap: true }
  });

  if (!employee) notFound();

  const createContractWithId = createContract.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/karyawan/${id}`}>
            <Button variant="outline">Batal</Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tambah Kontrak Baru</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detail Kontrak Baru</CardTitle>
            <CardDescription>
              Menambah masa kontrak untuk: <span className="font-semibold text-slate-900">{employee.namaLengkap}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createContractWithId} className="space-y-6">
              <div className="space-y-2">
                <Label>Posisi / Jabatan Baru</Label>
                <Select name="posisi" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Jabatan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALESMAN">SALESMAN</SelectItem>
                    <SelectItem value="ADMINISTRASI">ADMINISTRASI</SelectItem>
                    <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                    <SelectItem value="MANAGER">MANAGER</SelectItem>
                    <SelectItem value="STAFF IT">STAFF IT</SelectItem>
                    <SelectItem value="TEKNISI">TEKNISI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="traineeSejak">Mulai Kontrak</Label>
                  <Input id="traineeSejak" name="traineeSejak" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="traineeSelesai">Akhir Kontrak</Label>
                  <Input id="traineeSelesai" name="traineeSelesai" type="date" required />
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg">
                  Terbitkan Kontrak Baru
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}