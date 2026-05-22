'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2, Building2, User, UserCircle2, Info } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { toast } from 'sonner'

const REGION_OPTIONS = ['PONTIANAK', 'KALIMANTAN', 'SUMATERA', 'JAWA', 'SULAWESI', 'PAPUA']
const CABANG_OPTIONS = ['SAMBAS', 'PONTIANAK', 'SINGKAWANG', 'KETAPANG', 'SINTANG', 'SAMPIT', 'BANJARMASIN']

interface EditKaryawanFormProps {
  employee: any
  updateAction: (formData: FormData) => void
}

export function EditKaryawanForm({ employee, updateAction }: EditKaryawanFormProps) {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    try {
      await updateAction(formData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server'
      toast.error(msg)
      setIsPending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ─── Kiri: Form (8 kolom) ─── */}
      <div className="lg:col-span-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Formulir Pembaruan Data</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ubah informasi operasional dan identitas pribadi karyawan.
            </p>
          </div>

          <form action={handleSubmit} className="px-6 py-6 space-y-8">

            {/* ─── A. Data Operasional ─── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
                <span className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">A</span>
                <Building2 size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-gray-800">Data Operasional</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ba" className="form-label">
                    BA (Branch Code) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="ba" name="ba" defaultValue={employee.ba} required className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baCabang" className="form-label">
                    BA Cabang <span className="text-red-500">*</span>
                  </Label>
                  <Input id="baCabang" name="baCabang" defaultValue={employee.baCabang} required className="h-9 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region" className="form-label">
                    Region <span className="text-red-500">*</span>
                  </Label>
                  <Select name="region" defaultValue={employee.region} required>
                    <SelectTrigger id="region" className="h-9 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabang" className="form-label">
                    Nama Cabang <span className="text-red-500">*</span>
                  </Label>
                  <Select name="cabang" defaultValue={employee.cabang} required>
                    <SelectTrigger id="cabang" className="h-9 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CABANG_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* ─── B. Identitas Karyawan ─── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-green-100">
                <span className="h-6 w-6 rounded-md bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">B</span>
                <User size={15} className="text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">Identitas Karyawan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaLengkap" className="form-label">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaLengkap" name="namaLengkap"
                    defaultValue={employee.namaLengkap}
                    required className="h-9 text-sm uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nik" className="form-label">NIK Karyawan</Label>
                  <Input
                    id="nik" name="nik"
                    defaultValue={employee.nik || ''}
                    placeholder="Diisi oleh HO"
                    className="h-9 text-sm font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Bisa dikosongkan</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noKtp" className="form-label">
                    Nomor KTP <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="noKtp" name="noKtp"
                    defaultValue={employee.noKtp}
                    required className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglLahir" className="form-label">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tglLahir" name="tglLahir"
                    type="date" defaultValue={employee.tglLahir}
                    required className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaIbu" className="form-label">
                    Nama Ibu Kandung <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaIbu" name="namaIbu"
                    defaultValue={employee.namaIbu}
                    required className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noHp" className="form-label">
                    No. HP / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="noHp" name="noHp"
                    defaultValue={employee.noHp}
                    required className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noJamsostek" className="form-label">No Jamsostek</Label>
                  <Input
                    id="noJamsostek" name="noJamsostek"
                    defaultValue={employee.noJamsostek || ''}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formConsent" className="form-label">
                    Form Consent <span className="text-red-500">*</span>
                  </Label>
                  <Select name="formConsent" defaultValue={employee.formConsent} required>
                    <SelectTrigger id="formConsent" className="h-9 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADA">ADA</SelectItem>
                      <SelectItem value="TIDAK ADA">TIDAK ADA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Status — hanya di edit form */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="status" className="form-label">
                    Status Karyawan <span className="text-red-500">*</span>
                  </Label>
                  <Select name="status" defaultValue={employee.status} required>
                    <SelectTrigger id="status" className="h-9 text-sm bg-white max-w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> AKTIF
                        </span>
                      </SelectItem>
                      <SelectItem value="NON-AKTIF">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" /> NON-AKTIF
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Ubah ke Non-Aktif jika karyawan sudah keluar atau kontrak tidak dilanjutkan.
                  </p>
                </div>
              </div>
            </section>

            {/* ─── Submit ─── */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save size={16} /> Simpan Perubahan</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ─── Kanan: Upload Foto (4 kolom) ─── */}
      <div className="lg:col-span-4">
        <div className="sticky top-20 space-y-4">

          {/* Photo card */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center">
                <UserCircle2 className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">Foto Karyawan</h2>
            </div>
            <div className="px-5 py-6 flex flex-col items-center">
              <ImageUpload
                employeeId={employee.id}
                currentImage={employee.image || undefined}
              />
            </div>
          </div>

          {/* Info card */}
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg border border-blue-100 bg-blue-50/50">
            <Info size={15} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 leading-relaxed">
              Gunakan foto dengan latar belakang polos untuk mempermudah proses pembuatan ID Card.
            </p>
          </div>

          {/* Meta info */}
          <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Info Sistem</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-xs text-gray-700">{employee.id.substring(0, 12)}…</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={employee.status === 'AKTIF' ? 'chip-aktif' : 'chip-nonaktif'}>
                {employee.status}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
