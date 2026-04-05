'use client';

import { useState, useEffect } from 'react';
import { addMonths, format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ContractFormProps {
  employeeId: string;
  action: (id: string, formData: FormData) => Promise<void>;
}

export function ContractForm({ employeeId, action }: ContractFormProps) {
  const [posisi, setPosisi] = useState<string>('');
  const [tglMulai, setTglMulai] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [tglSelesai, setTglSelesai] = useState<string>('');

  // Logika Otomatisasi Tanggal (Aturan Bisnis 2)
  useEffect(() => {
    if (posisi && tglMulai) {
      const startDate = new Date(tglMulai);
      // Jika Admin 3 bulan, selain itu (Salesman dll) 6 bulan
      const monthsToAdd = posisi === 'ADMINISTRASI' ? 3 : 6;
      const endDate = addMonths(startDate, monthsToAdd);
      
      setTglSelesai(format(endDate, 'yyyy-MM-dd'));
    }
  }, [posisi, tglMulai]);

  return (
    <form action={(formData) => action(employeeId, formData)} className="space-y-6">
      <div className="space-y-2">
        <Label>Posisi / Jabatan Baru</Label>
        <Select name="posisi" onValueChange={(value) => setPosisi(value)} required>
          <SelectTrigger>
            <SelectValue placeholder="Pilih Jabatan" />
          </SelectTrigger>
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
            value={tglMulai}
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
            readOnly // User tidak perlu isi manual, tapi tetap terkirim di FormData
            className="bg-slate-100 font-semibold text-blue-700"
            required 
          />
          <p className="text-[10px] text-slate-500 italic">
            *Dihitung otomatis berdasarkan aturan jabatan.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full h-12 text-lg">
          Terbitkan Kontrak Baru
        </Button>
      </div>
    </form>
  );
}