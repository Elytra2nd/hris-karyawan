'use client'

import { useState, useEffect } from 'react'
import { addMonths, format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { Info, Buildings, User, FileTextIcon, CalendarCheck, CircleNotch } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectCombobox } from '@/components/ui/select-combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { FieldError } from '@/components/ui/field-error'
import { createEmployeeSchema } from '@/lib/validation'

const POSISI_OPTIONS = [
  { value: 'SALESMAN', label: 'Salesman', months: 6 },
  { value: 'ADMINISTRASI', label: 'Administrasi', months: 3 },
  { value: 'SUPERVISOR', label: 'Supervisor', months: 6 },
  { value: 'MANAGER', label: 'Manager', months: 6 },
  { value: 'STAFF IT', label: 'Staff IT', months: 6 },
  { value: 'TEKNISI', label: 'Teknisi', months: 6 },
]

const REGION_OPTIONS = ['PONTIANAK', 'KALIMANTAN', 'SUMATERA', 'JAWA', 'SULAWESI', 'PAPUA']
const CABANG_OPTIONS = ['SAMBAS', 'PONTIANAK', 'SINGKAWANG', 'KETAPANG', 'SINTANG', 'SAMPIT', 'BANJARMASIN']

interface Department { id: string; name: string; code: string }

export function EmployeeForm({
  action,
  departments = [],
}: {
  action: (formData: FormData) => void
  departments?: Department[]
}) {
  const [posisi, setPosisi] = useState('')
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (posisi && tglMulai) {
      const opt = POSISI_OPTIONS.find(p => p.value === posisi)
      const months = opt?.months ?? 6
      setTglSelesai(format(addMonths(new Date(tglMulai), months), 'yyyy-MM-dd'))
    }
  }, [posisi, tglMulai])

  const handleSubmit = async (formData: FormData) => {
    // Client-side validation — instant feedback before round-trip
    const raw: Record<string, string | null> = {}
    formData.forEach((v, k) => {
      const s = v.toString().trim()
      raw[k] = s === '' ? null : s
    })

    const parsed = createEmployeeSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach(e => {
        const field = e.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      toast.error('Periksa kembali isian yang ditandai')
      // Focus first invalid field
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) {
        const el = document.getElementById(String(firstField))
        el?.focus()
      }
      return
    }

    setErrors({})
    setIsPending(true)
    try {
      await action(formData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server'
      toast.error(msg)
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">

      {/* ─── A. Data Operasional ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<Buildings size={15} className="text-primary" />}
          letter="A"
          title="Data Operasional"
          color="blue"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="ba" label="BA (Branch Code)" name="ba" placeholder="Contoh: H730" required error={errors.ba} />
          <FormField id="baCabang" label="BA Cabang" name="baCabang" placeholder="Contoh: SAMBAS" required error={errors.baCabang} />
          <div className="space-y-2">
            <Label htmlFor="region" className="form-label">
              Region <span className="text-red-500">*</span>
            </Label>
            <SelectCombobox
              id="region"
              name="region"
              required
              options={REGION_OPTIONS}
              placeholder="Pilih region..."
            />
            <FieldError message={errors.region} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cabang" className="form-label">
              Cabang <span className="text-red-500">*</span>
            </Label>
            <SelectCombobox
              id="cabang"
              name="cabang"
              required
              options={CABANG_OPTIONS}
              placeholder="Pilih cabang..."
            />
            <FieldError message={errors.cabang} />
          </div>
        </div>

        {/* Departemen — tampil hanya jika ada data */}
        {departments.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="departmentId" className="form-label">
              Departemen
              <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <SelectCombobox
              id="departmentId"
              name="departmentId"
              options={[
                { value: '', label: 'Tidak ditugaskan' },
                ...departments.map(d => ({ value: d.id, label: d.name, hint: d.code })),
              ]}
              placeholder="Pilih departemen..."
            />
          </div>
        )}
      </section>

      {/* ─── B. Identitas Karyawan ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<User size={15} className="text-green-600" />}
          letter="B"
          title="Identitas Karyawan"
          color="green"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="namaLengkap" label="Nama Lengkap (sesuai KTP)"
            name="namaLengkap" placeholder="Nama lengkap" required
            className="uppercase"
            error={errors.namaLengkap}
          />
          <FormField
            id="nik" label="NIK Karyawan"
            name="nik" placeholder="Diisi oleh HO"
            hint="Bisa dikosongkan dan diisi nanti"
            error={errors.nik}
          />
          <FormField
            id="noKtp" label="No KTP"
            name="noKtp" placeholder="16 digit angka" required
            className="font-mono"
            error={errors.noKtp}
          />
          <div className="space-y-2">
            <Label htmlFor="tglLahir" className="form-label">
              Tanggal Lahir <span className="text-red-500">*</span>
            </Label>
            <DatePicker id="tglLahir" name="tglLahir" required placeholder="Pilih tanggal lahir" />
            <FieldError message={errors.tglLahir} />
          </div>
          <FormField
            id="namaIbu" label="Nama Ibu Kandung"
            name="namaIbu" placeholder="Sesuai KTP" required
            error={errors.namaIbu}
          />
          <FormField
            id="noHp" label="No HP / WhatsApp"
            name="noHp" placeholder="08xxxxxxxxxx" required
            error={errors.noHp}
            hint="Diawali 08, 10-15 digit"
          />
          <FormField
            id="noJamsostek" label="No Jamsostek"
            name="noJamsostek" placeholder="Opsional"
            className="font-mono"
            error={errors.noJamsostek}
          />
          <div className="space-y-2">
            <Label htmlFor="formConsent" className="form-label">
              Form Consent <span className="text-red-500">*</span>
            </Label>
            <SelectCombobox
              id="formConsent"
              name="formConsent"
              required
              options={['ADA', 'TIDAK ADA']}
              placeholder="Pilih..."
            />
            <FieldError message={errors.formConsent} />
          </div>
        </div>
      </section>

      {/* ─── C. Kontrak Pertama ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<FileTextIcon size={15} className="text-orange-500" />}
          letter="C"
          title="Kontrak Pertama"
          color="orange"
        />

        <div className="space-y-2">
          <Label htmlFor="posisi" className="form-label">
            Posisi / Jabatan <span className="text-red-500">*</span>
          </Label>
          <SelectCombobox
            id="posisi"
            name="posisi"
            required
            value={posisi}
            onValueChange={setPosisi}
            options={POSISI_OPTIONS.map(p => ({
              value: p.value,
              label: p.label,
              hint: `${p.months} bln`,
            }))}
            placeholder="Pilih jabatan..."
          />
          <FieldError message={errors.posisi} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="traineeSejak" className="form-label">
              Mulai Kontrak <span className="text-red-500">*</span>
            </Label>
            <DatePicker
              id="traineeSejak"
              name="traineeSejak"
              required
              value={tglMulai}
              onValueChange={setTglMulai}
              placeholder="Pilih tanggal mulai"
            />
            <FieldError message={errors.traineeSejak} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="traineeSelesai" className="form-label flex items-center gap-1.5">
              Akhir Kontrak
              <span className="text-[10px] font-normal text-primary bg-accent px-1.5 py-0.5 rounded">
                Otomatis
              </span>
            </Label>
            <div className="h-9 inline-flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-accent/50 px-3 text-sm font-semibold text-primary">
              <span className="truncate">
                {tglSelesai
                  ? format(new Date(tglSelesai), 'EEEE, dd MMM yyyy', { locale: localeID })
                  : 'Pilih posisi & tanggal'}
              </span>
              <CalendarCheck size={14} className="opacity-70 shrink-0" />
            </div>
          </div>
        </div>

        {/* Info tip */}
        {posisi && (
          <div className="flex items-start gap-2.5 rounded-md bg-accent border border-blue-100 px-4 py-3">
            <Info size={15} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Jabatan <strong>{posisi}</strong> otomatis mendapat kontrak{' '}
              <strong>{POSISI_OPTIONS.find(p => p.value === posisi)?.months} bulan</strong>{' '}
              dari tanggal mulai.
            </p>
          </div>
        )}

        {!posisi && (
          <div className="flex items-start gap-2.5 rounded-md bg-muted/50 border border-border px-4 py-3">
            <CalendarCheck size={15} className="text-muted-foreground/70 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Pilih jabatan untuk menghitung tanggal akhir kontrak secara otomatis.
            </p>
          </div>
        )}
      </section>

      {/* ─── Submit ─── */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isPending ? (
          <><CircleNotch size={16} className="animate-spin" /> Menyimpan...</>
        ) : (
          'Simpan Data Karyawan'
        )}
      </button>
    </form>
  )
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function SectionHeader({
  icon,
  letter,
  title,
  color,
}: {
  icon: React.ReactNode
  letter: string
  title: string
  color: 'blue' | 'green' | 'orange'
}) {
  const colorMap = {
    blue: 'bg-accent border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
  }
  const letterMap = {
    blue: 'bg-primary text-white',
    green: 'bg-green-600 text-white',
    orange: 'bg-orange-500 text-white',
  }
  return (
    <div className={`flex items-center gap-2.5 pb-3 border-b ${colorMap[color].split(' ')[1]}`}>
      <span className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${letterMap[color]}`}>
        {letter}
      </span>
      <div className="flex items-center gap-1.5">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
    </div>
  )
}

function FormField({
  id,
  label,
  name,
  placeholder,
  type = 'text',
  required,
  hint,
  className,
  error,
}: {
  id: string
  label: string
  name: string
  placeholder?: string
  type?: string
  required?: boolean
  hint?: string
  className?: string
  error?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="form-label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        nativeInput
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`h-9 text-sm ${error ? 'border-destructive' : ''} ${className ?? ''}`}
      />
      <FieldError id={`${id}-error`} message={error} />
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
