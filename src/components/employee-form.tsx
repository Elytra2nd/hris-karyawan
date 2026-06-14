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
import { useRouter } from 'next/navigation'

const POSISI_OPTIONS = [
  { value: 'SALES EXECUTIVE', label: 'Sales Executive', months: 6 },
  { value: 'SALESGIRL', label: 'Salesgirl', months: 6 },
  { value: 'COUNTER SALES', label: 'Counter Sales', months: 6 },
  { value: 'MECHANIC', label: 'Mechanic', months: 6 },
  { value: 'TEAM LEADER', label: 'Team Leader', months: 6 },
  { value: 'ADMINISTRATOR', label: 'Administrator', months: 3 },
]

interface Branch { code: string; label: string }
interface Department { id: string; name: string; code: string }

export function EmployeeForm({
  action,
  departments = [],
  branches = [],
}: {
  action: (formData: FormData) => Promise<any>
  departments?: Department[]
  branches?: Branch[]
}) {
  const router = useRouter()
  const [posisi, setPosisi] = useState('')
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // On-blur per-field validation pakai Zod schema shape
  const blurField = (name: keyof typeof createEmployeeSchema.shape, value: string) => {
    const shape = createEmployeeSchema.shape
    if (!(name in shape)) return
    const result = (shape[name] as { safeParse: (v: unknown) => { success: boolean; error?: { issues: { message: string }[] } } })
      .safeParse(value === '' ? null : value)
    if (!result.success) {
      setErrors(prev => ({ ...prev, [name]: result.error?.issues[0]?.message ?? 'Tidak valid' }))
    } else {
      setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
    }
  }

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
      toast.error('Ada isian yang belum sesuai — lihat kolom yang ditandai merah')
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
      const res = await action(formData)
      if (res && res.success === false) {
        toast.error(res.error)
        setIsPending(false)
        return
      }
      toast.success('Data karyawan berhasil disimpan')
      router.push('/karyawan')
    } catch {
      toast.error('Koneksi terputus — coba simpan ulang')
      setIsPending(false)
    }
  }

  return (
    <form action={handleSubmit} noValidate className="space-y-8">

      {/* ─── A. Data Operasional ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<Buildings size={16} className="text-primary" />}
          letter="A"
          title="Data Operasional"
          color="blue"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="ba" label="BA (Branch Code)" name="ba" placeholder="Contoh: H730" required error={errors.ba} onBlur={v => blurField('ba', v)} />
          <FormField id="baCabang" label="BA Cabang" name="baCabang" placeholder="Contoh: SAMBAS" required error={errors.baCabang} onBlur={v => blurField('baCabang', v)} />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cabang" className="form-label">
              Cabang <span className="text-red-500">*</span>
            </Label>
            <SelectCombobox
              id="cabang"
              name="cabang"
              required
              options={branches.map(b => ({ value: b.code, label: `${b.code} — ${b.label}` }))}
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
                ...departments.map(d => ({ value: d.id, label: `${d.name} — ${d.code}` })),
              ]}
              placeholder="Pilih departemen..."
            />
          </div>
        )}
      </section>

      {/* ─── B. Identitas Karyawan ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<User size={16} className="text-green-600" />}
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
            onBlur={v => blurField('namaLengkap', v)}
          />
          <FormField
            id="nik" label="NIK Karyawan"
            name="nik" placeholder="Diisi oleh HO"
            hint="Bisa dikosongkan dan diisi nanti"
            error={errors.nik}
            onBlur={v => blurField('nik', v)}
          />
          <FormField
            id="noKtp" label="No KTP"
            name="noKtp" placeholder="16 digit angka" required
            className="font-mono"
            error={errors.noKtp}
            onBlur={v => blurField('noKtp', v)}
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
            onBlur={v => blurField('namaIbu', v)}
          />
          <FormField
            id="noHp" label="No HP / WhatsApp"
            name="noHp" placeholder="08xxxxxxxxxx" required
            error={errors.noHp}
            hint="Diawali 08, 10-15 digit"
            onBlur={v => blurField('noHp', v)}
          />
          <FormField
            id="noJamsostek" label="No Jamsostek"
            name="noJamsostek" placeholder="Opsional"
            className="font-mono"
            error={errors.noJamsostek}
            onBlur={v => blurField('noJamsostek', v)}
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
          icon={<FileTextIcon size={16} className="text-orange-500" />}
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
            <div className="h-9 inline-flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-accent/50 px-4 text-sm font-semibold text-primary">
              <span className="truncate">
                {tglSelesai
                  ? format(new Date(tglSelesai), 'EEEE, dd MMM yyyy', { locale: localeID })
                  : 'Pilih posisi & tanggal'}
              </span>
              <CalendarCheck size={16} className="opacity-70 shrink-0" />
            </div>
          </div>
        </div>

        {/* Info tip */}
        {posisi && (
          <div className="flex items-start gap-2 rounded-md bg-accent border border-blue-100 px-4 py-2">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Jabatan <strong>{posisi}</strong> otomatis mendapat kontrak{' '}
              <strong>{POSISI_OPTIONS.find(p => p.value === posisi)?.months} bulan</strong>{' '}
              dari tanggal mulai.
            </p>
          </div>
        )}

        {!posisi && (
          <div className="flex items-start gap-2 rounded-md bg-muted/50 border border-border px-4 py-2">
            <CalendarCheck size={16} className="text-muted-foreground/70 shrink-0 mt-0.5" />
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
        className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
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
    <div className={`flex items-center gap-2 pb-3 border-b ${colorMap[color].split(' ')[1]}`}>
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
  onBlur,
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
  onBlur?: (value: string) => void
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
        onBlur={onBlur ? (e) => onBlur((e.target as HTMLInputElement).value.trim()) : undefined}
      />
      <FieldError id={`${id}-error`} message={error} />
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
