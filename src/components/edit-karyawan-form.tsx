'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectCombobox } from '@/components/ui/select-combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { Save, Loader2, Building2, User, UserCircle2, Info } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { toast } from 'sonner'
import { FieldError } from '@/components/ui/field-error'
import { updateEmployeeSchema } from '@/lib/validation'

const REGION_OPTIONS = ['PONTIANAK', 'KALIMANTAN', 'SUMATERA', 'JAWA', 'SULAWESI', 'PAPUA']
const CABANG_OPTIONS = ['SAMBAS', 'PONTIANAK', 'SINGKAWANG', 'KETAPANG', 'SINTANG', 'SAMPIT', 'BANJARMASIN']

interface Department { id: string; name: string; code: string }

interface EditKaryawanFormProps {
  employee: any
  updateAction: (formData: FormData) => void
  departments?: Department[]
}

export function EditKaryawanForm({ employee, updateAction, departments = [] }: EditKaryawanFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (formData: FormData) => {
    const raw: Record<string, string | null> = {}
    formData.forEach((v, k) => {
      const s = v.toString().trim()
      raw[k] = s === '' ? null : s
    })

    const parsed = updateEmployeeSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach(e => {
        const field = e.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      toast.error('Periksa kembali isian yang ditandai')
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) document.getElementById(String(firstField))?.focus()
      return
    }

    setErrors({})
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
                  <Input id="ba" name="ba" defaultValue={employee.ba} required nativeInput aria-invalid={!!errors.ba} className={`h-9 text-sm ${errors.ba ? 'border-destructive' : ''}`} />
                  <FieldError message={errors.ba} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baCabang" className="form-label">
                    BA Cabang <span className="text-red-500">*</span>
                  </Label>
                  <Input id="baCabang" name="baCabang" defaultValue={employee.baCabang} required nativeInput aria-invalid={!!errors.baCabang} className={`h-9 text-sm ${errors.baCabang ? 'border-destructive' : ''}`} />
                  <FieldError message={errors.baCabang} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region" className="form-label">
                    Region <span className="text-red-500">*</span>
                  </Label>
                  <SelectCombobox
                    id="region"
                    name="region"
                    required
                    value={employee.region}
                    options={REGION_OPTIONS}
                    placeholder="Pilih region..."
                  />
                  <FieldError message={errors.region} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cabang" className="form-label">
                    Nama Cabang <span className="text-red-500">*</span>
                  </Label>
                  <SelectCombobox
                    id="cabang"
                    name="cabang"
                    required
                    value={employee.cabang}
                    options={CABANG_OPTIONS}
                    placeholder="Pilih cabang..."
                  />
                  <FieldError message={errors.cabang} />
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
                    required nativeInput aria-invalid={!!errors.namaLengkap}
                    className={`h-9 text-sm uppercase ${errors.namaLengkap ? 'border-destructive' : ''}`}
                  />
                  <FieldError message={errors.namaLengkap} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nik" className="form-label">NIK Karyawan</Label>
                  <Input
                    id="nik" name="nik"
                    defaultValue={employee.nik || ''}
                    placeholder="Diisi oleh HO"
                    nativeInput aria-invalid={!!errors.nik}
                    className={`h-9 text-sm font-mono ${errors.nik ? 'border-destructive' : ''}`}
                  />
                  <FieldError message={errors.nik} />
                  {!errors.nik && <p className="text-xs text-muted-foreground">Bisa dikosongkan</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noKtp" className="form-label">
                    Nomor KTP <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="noKtp" name="noKtp"
                    defaultValue={employee.noKtp}
                    required nativeInput aria-invalid={!!errors.noKtp}
                    className={`h-9 text-sm font-mono ${errors.noKtp ? 'border-destructive' : ''}`}
                  />
                  <FieldError message={errors.noKtp} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tglLahir" className="form-label">
                    Tanggal Lahir <span className="text-red-500">*</span>
                  </Label>
                  <DatePicker
                    id="tglLahir"
                    name="tglLahir"
                    required
                    value={employee.tglLahir}
                    placeholder="Pilih tanggal lahir"
                  />
                  <FieldError message={errors.tglLahir} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaIbu" className="form-label">
                    Nama Ibu Kandung <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaIbu" name="namaIbu"
                    defaultValue={employee.namaIbu}
                    required nativeInput aria-invalid={!!errors.namaIbu}
                    className={`h-9 text-sm ${errors.namaIbu ? 'border-destructive' : ''}`}
                  />
                  <FieldError message={errors.namaIbu} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noHp" className="form-label">
                    No. HP / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="noHp" name="noHp"
                    defaultValue={employee.noHp}
                    required nativeInput aria-invalid={!!errors.noHp}
                    className={`h-9 text-sm ${errors.noHp ? 'border-destructive' : ''}`}
                  />
                  <FieldError message={errors.noHp} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noJamsostek" className="form-label">No Jamsostek</Label>
                  <Input
                    id="noJamsostek" name="noJamsostek"
                    defaultValue={employee.noJamsostek || ''}
                    nativeInput aria-invalid={!!errors.noJamsostek}
                    className={`h-9 text-sm font-mono ${errors.noJamsostek ? 'border-destructive' : ''}`}
                  />
                  <FieldError message={errors.noJamsostek} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formConsent" className="form-label">
                    Form Consent <span className="text-red-500">*</span>
                  </Label>
                  <SelectCombobox
                    id="formConsent"
                    name="formConsent"
                    required
                    value={employee.formConsent}
                    options={['ADA', 'TIDAK ADA']}
                    placeholder="Pilih..."
                  />
                </div>
                {/* Status — hanya di edit form */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="status" className="form-label">
                    Status Karyawan <span className="text-red-500">*</span>
                  </Label>
                  <div className="max-w-[240px]">
                    <SelectCombobox
                      id="status"
                      name="status"
                      required
                      value={employee.status}
                      options={['AKTIF', 'NON-AKTIF']}
                      placeholder="Pilih status..."
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ubah ke Non-Aktif jika karyawan sudah keluar atau kontrak tidak dilanjutkan.
                  </p>
                </div>

                {/* Departemen */}
                {departments.length > 0 && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="departmentId" className="form-label">
                      Departemen
                      <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(opsional)</span>
                    </Label>
                    <div className="max-w-xs">
                      <SelectCombobox
                        id="departmentId"
                        name="departmentId"
                        value={employee.departmentId ?? ''}
                        options={[
                          { value: '', label: 'Tidak ditugaskan' },
                          ...departments.map((d: Department) => ({ value: d.id, label: d.name, hint: d.code })),
                        ]}
                        placeholder="Pilih departemen..."
                      />
                    </div>
                  </div>
                )}
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
