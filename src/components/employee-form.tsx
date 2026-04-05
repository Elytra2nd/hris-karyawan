'use client';

import { useState, useEffect } from 'react';
import { addMonths, format } from 'date-fns';
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

export function EmployeeForm({ action }: { action: (formData: FormData) => void }) {
  const [posisi, setPosisi] = useState<string>('');
  const [tglMulai, setTglMulai] = useState<string>('');
  const [tglSelesai, setTglSelesai] = useState<string>('');

  // Logika Otomatisasi Tanggal Selesai
  useEffect(() => {
    if (posisi && tglMulai) {
      const startDate = new Date(tglMulai);
      const monthsToAdd = posisi === 'ADMINISTRASI' ? 3 : 6;
      const endDate = addMonths(startDate, monthsToAdd);
      setTglSelesai(format(endDate, 'yyyy-MM-dd'));
    }
  }, [posisi, tglMulai]);

  return (
    <form action={action} className="space-y-8">
      {/* Bagian 1: Data Operasional */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700 border-b pb-2">A. Data Operasional</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <SelectTrigger><SelectValue placeholder="Pilih Region" /></SelectTrigger>
              <SelectContent>
                {["KALIMANTAN", "SUMATERA", "JAWA", "SULAWESI", "PAPUA"].map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cabang</Label>
            <Select name="cabang" required>
              <SelectTrigger><SelectValue placeholder="Pilih Cabang" /></SelectTrigger>
              <SelectContent>
                {["PONTIANAK", "SINGKAWANG", "KETAPANG", "SINTANG", "SAMPIT", "BANJARMASIN"].map(c => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="namaLengkap">Nama Lengkap</Label>
            <Input id="namaLengkap" name="namaLengkap" placeholder="Sesuai KTP" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nik">NIK Karyawan</Label>
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
            <Label htmlFor="noJamsostek">No Jamsostek</Label>
            <Input id="noJamsostek" name="noJamsostek" />
          </div>
          <div className="space-y-2">
            <Label>Form Consent</Label>
            <Select name="formConsent" required>
              <SelectTrigger><SelectValue placeholder="Status Dokumen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ADA">ADA</SelectItem>
                <SelectItem value="TIDAK ADA">TIDAK ADA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bagian 3: Kontrak Pertama */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-700 border-b pb-2">C. Kontrak Pertama</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Posisi / Jabatan</Label>
            <Select name="posisi" onValueChange={setPosisi} required>
              <SelectTrigger><SelectValue placeholder="Pilih Jabatan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALESMAN">SALESMAN (6 Bulan)</SelectItem>
                <SelectItem value="ADMINISTRASI">ADMINISTRASI (3 Bulan)</SelectItem>
                <SelectItem value="SUPERVISOR">SUPERVISOR (6 Bulan)</SelectItem>
                <SelectItem value="MANAGER">MANAGER (6 Bulan)</SelectItem>
                <SelectItem value="STAFF IT">STAFF IT (6 Bulan)</SelectItem>
                <SelectItem value="TEKNISI">TEKNISI (6 Bulan)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="traineeSejak">Mulai Kontrak</Label>
              <Input 
                id="traineeSejak" 
                name="traineeSejak" 
                type="date" 
                onChange={(e) => setTglMulai(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="traineeSelesai">Akhir Kontrak (Otomatis)</Label>
              <Input 
                id="traineeSelesai" 
                name="traineeSelesai" 
                type="date" 
                value={tglSelesai} 
                readOnly 
                className="bg-slate-100 font-medium text-blue-700"
                required 
              />
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
  );
}