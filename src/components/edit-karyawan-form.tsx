'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectCombobox } from '@/components/ui/select-combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { FloppyDisk, CircleNotch, Buildings, User, UserCircleIcon, Info, Warning } from '@phosphor-icons/react'
import { ImageUpload } from '@/components/image-upload'
import { toast } from 'sonner'
import { FieldError } from '@/components/ui/field-error'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { updateEmployeeSchema } from '@/lib/validation'
import type { EmployeeWithoutContracts, Department } from '@/types'
import { useRouter } from 'next/navigation'

interface Branch { code: string; label: string }

interface EditKaryawanFormProps {
  employee: EmployeeWithoutContracts
  updateAction: (formData: FormData) => Promise<{ success: boolean; error?: string; message?: string; code?: string }>
  departments?: Department[]
  branches?: Branch[]
}

export function EditKaryawanForm({ employee, updateAction, departments = [], branches = [] }: EditKaryawanFormProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [statusValue, setStatusValue] = useState(employee.status)
  const [showNonAktifDialog, setShowNonAktifDialog] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const handleStatusChange = (val: string) => {
    if (val === 'NON-AKTIF' && statusValue === 'AKTIF') {
      setShowNonAktifDialog(true)
    } else {
      setStatusValue(val)
    }
  }

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
      toast.error('Ada isian yang belum sesuai — lihat kolom yang ditandai merah')
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) document.getElementById(String(firstField))?.focus()
      return
    }

    setErrors({})
    setIsPending(true)
    try {
      const res = await updateAction(formData)
      if (res && res.success === false) {
        toast.error(res.error)
        setIsPending(false)
        return
      }
      toast.success('Perubahan berhasil disimpan')
      router.push(`/karyawan/${employee.id}`)
    } catch {
      toast.error('Koneksi terputus — coba simpan ulang')
      setIsPending(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

      {/* ─── Kiri: Form (8 kolom) ─── */}
      <div className="lg:col-span-8">
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/60">
            <h2 className="text-base font-semibold text-foreground">Formulir Pembaruan Data</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ubah informasi operasional dan identitas pribadi karyawan.
            </p>
          </div>

          <form action={handleSubmit} noValidate onChange={() => setIsDirty(true)} className="px-6 py-6 space-y-8">

            {/* ─── A. Data Operasional ─── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-blue-100">
                <span className="h-6 w-6 rounded-md bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">A</span>
                <Buildings size={16} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Data Operasional</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ba" className="form-label">
                    BA (Branch Code) <span className="text-red-500">*</span>
                  </Label>
                  <Input id="ba" name="ba" defaultValue={employee.ba} required nativeInput size="sm" aria-invalid={!!errors.ba} aria-describedby={errors.ba ? 'ba-error' : undefined} className={errors.ba ? 'border-destructive' : ''} />
                  <FieldError id="ba-error" message={errors.ba} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baCabang" className="form-label">
                    BA Cabang <span className="text-red-500">*</span>
                  </Label>
                  <Input id="baCabang" name="baCabang" defaultValue={employee.baCabang} required nativeInput size="sm" aria-invalid={!!errors.baCabang} aria-describedby={errors.baCabang ? 'baCabang-error' : undefined} className={errors.baCabang ? 'border-destructive' : ''} />
                  <FieldError id="baCabang-error" message={errors.baCabang} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cabang" className="form-label">
                    Cabang <span className="text-red-500">*</span>
                  </Label>
                  <SelectCombobox
                    id="cabang"
                    name="cabang"
                    required
                    size="sm"
                    value={employee.cabang}
                    options={branches.map(b => ({ value: b.code, label: `${b.code} — ${b.label}` }))}
                    placeholder="Pilih cabang..."
                  />
                  <FieldError id="cabang-error" message={errors.cabang} />
                </div>
              </div>
            </section>

            {/* ─── B. Identitas Karyawan ─── */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-green-100">
                <span className="h-6 w-6 rounded-md bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">B</span>
                <User size={16} className="text-green-600" />
                <h3 className="text-sm font-semibold text-foreground">Identitas Karyawan</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="namaLengkap" className="form-label">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaLengkap" name="namaLengkap"
                    defaultValue={employee.namaLengkap}
                    required nativeInput size="sm" aria-invalid={!!errors.namaLengkap}
                    aria-describedby={errors.namaLengkap ? 'namaLengkap-error' : undefined}
                    className={`uppercase ${errors.namaLengkap ? 'border-destructive' : ''}`}
                  />
                  <FieldError id="namaLengkap-error" message={errors.namaLengkap} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nik" className="form-label">NIK Karyawan</Label>
                  <Input
                    id="nik" name="nik"
                    defaultValue={employee.nik || ''}
                    placeholder="Diisi oleh HO"
                    nativeInput size="sm" aria-invalid={!!errors.nik}
                    aria-describedby={errors.nik ? 'nik-error' : undefined}
                    className={`font-mono ${errors.nik ? 'border-destructive' : ''}`}
                  />
                  <FieldError id="nik-error" message={errors.nik} />
                  {!errors.nik && <p className="text-xs text-muted-foreground">Bisa dikosongkan</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noKtp" className="form-label">
                    Nomor KTP <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="noKtp" name="noKtp"
                    defaultValue={employee.noKtp}
                    required nativeInput size="sm" aria-invalid={!!errors.noKtp}
                    aria-describedby={errors.noKtp ? 'noKtp-error' : undefined}
                    className={`font-mono ${errors.noKtp ? 'border-destructive' : ''}`}
                  />
                  <FieldError id="noKtp-error" message={errors.noKtp} />
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
                  <FieldError id="tglLahir-error" message={errors.tglLahir} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namaIbu" className="form-label">
                    Nama Ibu Kandung <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="namaIbu" name="namaIbu"
                    defaultValue={employee.namaIbu}
                    required nativeInput size="sm" aria-invalid={!!errors.namaIbu}
                    aria-describedby={errors.namaIbu ? 'namaIbu-error' : undefined}
                    className={errors.namaIbu ? 'border-destructive' : ''}
                  />
                  <FieldError id="namaIbu-error" message={errors.namaIbu} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noHp" className="form-label">
                    No. HP / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="noHp" name="noHp"
                    defaultValue={employee.noHp}
                    required nativeInput size="sm" aria-invalid={!!errors.noHp}
                    aria-describedby={errors.noHp ? 'noHp-error' : undefined}
                    className={errors.noHp ? 'border-destructive' : ''}
                  />
                  <FieldError id="noHp-error" message={errors.noHp} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noJamsostek" className="form-label">No Jamsostek</Label>
                  <Input
                    id="noJamsostek" name="noJamsostek"
                    defaultValue={employee.noJamsostek || ''}
                    nativeInput size="sm" aria-invalid={!!errors.noJamsostek}
                    aria-describedby={errors.noJamsostek ? 'noJamsostek-error' : undefined}
                    className={`font-mono ${errors.noJamsostek ? 'border-destructive' : ''}`}
                  />
                  <FieldError id="noJamsostek-error" message={errors.noJamsostek} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="formConsent" className="form-label">
                    Form Consent <span className="text-red-500">*</span>
                  </Label>
                  <SelectCombobox
                    id="formConsent"
                    name="formConsent"
                    required
                    size="sm"
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
                      size="sm"
                      value={statusValue}
                      onValueChange={handleStatusChange}
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
                        size="sm"
                        value={employee.departmentId ?? ''}
                        options={[
                          { value: '', label: 'Tidak ditugaskan' },
                          ...departments.map((d: Department) => ({ value: d.id, label: `${d.name} — ${d.code}` })),
                        ]}
                        placeholder="Pilih departemen..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ─── Submit ─── */}
            <div className="pt-2 border-t border-border/60 space-y-4">
              {isDirty && !isPending && (
                <p className="text-xs text-amber-600 flex items-center gap-1.5">
                  <Warning size={12} />
                  Ada perubahan belum disimpan
                </p>
              )}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {isPending ? (
                  <><CircleNotch size={16} className="animate-spin" /> Menyimpan...</>
                ) : (
                  <><FloppyDisk size={16} /> Simpan Perubahan</>
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
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
                <UserCircleIcon className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Foto Karyawan</h2>
            </div>
            <div className="px-5 py-6 flex flex-col items-center">
              <ImageUpload
                employeeId={employee.id}
                currentImage={employee.image || undefined}
              />
            </div>
          </div>

          {/* Info card */}
          <div className="flex items-start gap-4 px-4 py-3.5 rounded-lg border border-blue-100 bg-accent/50">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 leading-relaxed">
              Gunakan foto dengan latar belakang polos untuk mempermudah proses pembuatan ID Card.
            </p>
          </div>

          {/* Meta info */}
          <div className="bg-card border border-border rounded-lg px-6 py-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Info Sistem</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-xs text-foreground/80">{employee.id.substring(0, 12)}…</span>
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

      {/* ─── Konfirmasi Non-Aktif ─── */}
      <AlertDialog open={showNonAktifDialog} onOpenChange={setShowNonAktifDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={20} className="text-amber-600" />
              Ubah Status ke Non-Aktif?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Karyawan <strong>{employee.namaLengkap}</strong> akan ditandai sebagai Non-Aktif.
              Aksi ini menghentikan tracking kontrak dan karyawan tidak akan muncul di laporan aktif.
              Anda masih bisa mengubahnya kembali ke Aktif kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNonAktifDialog(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setStatusValue('NON-AKTIF'); setShowNonAktifDialog(false) }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Ya, Set Non-Aktif
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
