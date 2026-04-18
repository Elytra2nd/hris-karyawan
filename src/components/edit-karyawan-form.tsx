'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ChevronLeft, UserCircle2, Info } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';
import { Badge } from '@/components/ui/badge';

interface EditKaryawanFormProps {
  employee: any;
  updateAction: (formData: FormData) => void;
}

export function EditKaryawanForm({ employee, updateAction }: EditKaryawanFormProps) {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* SISI KIRI: Formulir Data (8 Kolom) */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg font-bold">Formulir Pembaruan Data</CardTitle>
            <CardDescription>
              Ubah informasi operasional dan identitas pribadi karyawan.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={updateAction} className="space-y-8">
              
              {/* Bagian 1: Data Operasional */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" /> A. Data Operasional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sans">
                  <div className="space-y-2">
                    <Label htmlFor="ba" className="font-bold">Unit BA</Label>
                    <Input id="ba" name="ba" defaultValue={employee.ba} className="bg-slate-50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baCabang" className="font-bold">BA Cabang</Label>
                    <Input id="baCabang" name="baCabang" defaultValue={employee.baCabang} className="bg-slate-50" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Region</Label>
                    <Select name="region" defaultValue={employee.region} required>
                      <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["KALIMANTAN", "SUMATERA", "JAWA", "SULAWESI", "PAPUA"].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Nama Cabang</Label>
                    <Select name="cabang" defaultValue={employee.cabang} required>
                      <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
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
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 pt-4">
                  <span className="w-2 h-2 bg-blue-600 rounded-full" /> B. Identitas Karyawan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="namaLengkap" className="font-bold">Nama Lengkap</Label>
                    <Input id="namaLengkap" name="namaLengkap" defaultValue={employee.namaLengkap} className="bg-slate-50 uppercase font-bold" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nik" className="font-bold">NIK Karyawan</Label>
                    <Input id="nik" name="nik" defaultValue={employee.nik || ''} className="bg-slate-50 font-mono" placeholder="Diisi oleh HO" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noKtp" className="font-bold">Nomor KTP</Label>
                    <Input id="noKtp" name="noKtp" defaultValue={employee.noKtp} className="bg-slate-50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tglLahir" className="font-bold">Tanggal Lahir</Label>
                    <Input id="tglLahir" name="tglLahir" type="date" defaultValue={employee.tglLahir} className="bg-slate-50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="namaIbu" className="font-bold">Nama Ibu Kandung</Label>
                    <Input id="namaIbu" name="namaIbu" defaultValue={employee.namaIbu} className="bg-slate-50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noHp" className="font-bold">No. HP / WhatsApp</Label>
                    <Input id="noHp" name="noHp" defaultValue={employee.noHp} className="bg-slate-50" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noJamsostek" className="font-bold">No Jamsostek</Label>
                    <Input id="noJamsostek" name="noJamsostek" defaultValue={employee.noJamsostek || ''} className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Form Consent</Label>
                    <Select name="formConsent" defaultValue={employee.formConsent} required>
                      <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADA">ADA</SelectItem>
                        <SelectItem value="TIDAK ADA">TIDAK ADA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button type="submit" className="w-full h-12 text-sm font-black uppercase tracking-widest bg-blue-700 hover:bg-blue-800 shadow-lg shadow-blue-100 gap-2 transition-all active:scale-95">
                  <Save className="h-5 w-5" /> Simpan Perubahan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* SISI KANAN: Upload Foto (4 Kolom) */}
      <div className="lg:col-span-4">
        <div className="sticky top-24 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 flex items-center gap-2">
                <UserCircle2 className="w-4 h-4" /> Visual Identitas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8 flex flex-col items-center">
              {/* Komponen Upload Gambar */}
              <ImageUpload 
                employeeId={employee.id} 
                currentImage={employee.image || undefined} 
              />
              
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">Kelengkapan Digital</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="outline" className="bg-white text-[9px] font-black uppercase shadow-none border-slate-200">
                    ID: {employee.id.substring(0, 8)}
                  </Badge>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] font-black uppercase shadow-none">
                    Status: {employee.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 font-medium leading-relaxed italic">
              "Gunakan foto dengan latar belakang polos untuk mempermudah proses pembuatan ID Card otomatis nantinya."
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}