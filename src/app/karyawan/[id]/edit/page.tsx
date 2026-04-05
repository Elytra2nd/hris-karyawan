import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { updateEmployee } from '@/app/actions/employee';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  await verifySession();
  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) notFound();

  // Kita gunakan bind untuk mengirim ID ke Server Action
  const updateEmployeeWithId = updateEmployee.bind(null, id);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/karyawan/${id}`}>
            <Button variant="outline">Batal</Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Data Karyawan</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Pembaruan Data</CardTitle>
            <CardDescription>Ubah data identitas karyawan di bawah ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateEmployeeWithId} className="space-y-8">
              
              {/* Bagian 1: Data Operasional */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">A. Data Operasional</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ba">BA</Label>
                    <Input id="ba" name="ba" defaultValue={employee.ba} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baCabang">BA Cabang</Label>
                    <Input id="baCabang" name="baCabang" defaultValue={employee.baCabang} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select name="region" defaultValue={employee.region} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["KALIMANTAN", "SUMATERA", "JAWA", "SULAWESI", "PAPUA"].map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cabang</Label>
                    <Select name="cabang" defaultValue={employee.cabang} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["PONTIANAK", "SINGKAWANG", "KETAPANG", "SINTANG", "SAMPIT", "BANJARMASIN"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Identitas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">B. Identitas Karyawan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                    <Input id="namaLengkap" name="namaLengkap" defaultValue={employee.namaLengkap} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK Karyawan</Label>
                    <Input id="nik" name="nik" defaultValue={employee.nik || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noKtp">No KTP</Label>
                    <Input id="noKtp" name="noKtp" defaultValue={employee.noKtp} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tglLahir">Tanggal Lahir</Label>
                    <Input 
                      id="tglLahir" 
                      name="tglLahir" 
                      type="date" 
                      defaultValue={new Date(employee.tglLahir).toISOString().split('T')[0]} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="namaIbu">Nama Ibu Kandung</Label>
                    <Input id="namaIbu" name="namaIbu" defaultValue={employee.namaIbu} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noHp">No HP / WhatsApp</Label>
                    <Input id="noHp" name="noHp" defaultValue={employee.noHp} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Form Consent</Label>
                    <Select name="formConsent" defaultValue={employee.formConsent} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADA">ADA</SelectItem>
                        <SelectItem value="TIDAK ADA">TIDAK ADA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg">Simpan Perubahan</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}