import { verifySession } from '@/lib/dal';
import { createEmployee } from '@/app/actions/employee';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

export default async function TambahKaryawanPage() {
  await verifySession();

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline">Kembali</Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tambah Karyawan Baru
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Formulir Identitas & Kontrak</CardTitle>
            <CardDescription>
              Silakan lengkapi data karyawan di bawah ini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createEmployee} className="space-y-8">
              
              {/* Bagian 1: Data Operasional */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">A. Data Operasional</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ba">BA</Label>
                    <Input id="ba" name="ba" placeholder="Contoh: BA-01" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baCabang">BA Cabang</Label>
                    <Input id="baCabang" name="baCabang" placeholder="Contoh: BAC-01" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Region</Label>
                    <Select name="region" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KALIMANTAN">KALIMANTAN</SelectItem>
                        <SelectItem value="SUMATERA">SUMATERA</SelectItem>
                        <SelectItem value="JAWA">JAWA</SelectItem>
                        <SelectItem value="SULAWESI">SULAWESI</SelectItem>
                        <SelectItem value="PAPUA">PAPUA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cabang</Label>
                    <Select name="cabang" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Cabang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PONTIANAK">PONTIANAK</SelectItem>
                        <SelectItem value="SINGKAWANG">SINGKAWANG</SelectItem>
                        <SelectItem value="KETAPANG">KETAPANG</SelectItem>
                        <SelectItem value="SINTANG">SINTANG</SelectItem>
                        <SelectItem value="SAMPIT">SAMPIT</SelectItem>
                        <SelectItem value="BANJARMASIN">BANJARMASIN</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Data Diri */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">B. Identitas Karyawan</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                    <Input id="namaLengkap" name="namaLengkap" placeholder="Sesuai KTP" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nik">NIK Karyawan (Boleh Kosong)</Label>
                    <Input id="nik" name="nik" placeholder="Diisi oleh HO" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noKtp">No KTP</Label>
                    <Input id="noKtp" name="noKtp" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tglLahir">Tanggal Lahir</Label>
                    <Input id="tglLahir" name="tglLahir" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="namaIbu">Nama Ibu Kandung</Label>
                    <Input id="namaIbu" name="namaIbu" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noHp">No HP / WhatsApp</Label>
                    <Input id="noHp" name="noHp" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noJamsostek">No Jamsostek (Opsional)</Label>
                    <Input id="noJamsostek" name="noJamsostek" />
                  </div>
                  <div className="space-y-2">
                    <Label>Form Consent</Label>
                    <Select name="formConsent" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status Dokumen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADA">ADA</SelectItem>
                        <SelectItem value="TIDAK ADA">TIDAK ADA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bagian 3: Data Kontrak */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">C. Kontrak Pertama</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Posisi / Jabatan</Label>
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
                      <Label htmlFor="traineeSejak">Mulai Kontrak (Sejak)</Label>
                      <Input id="traineeSejak" name="traineeSejak" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="traineeSelesai">Akhir Kontrak (Selesai)</Label>
                      <Input id="traineeSelesai" name="traineeSelesai" type="date" required />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg">
                  Simpan Data Karyawan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}