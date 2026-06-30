'use client'

import React, { useState, useEffect, useRef } from 'react'
import { addMonths, subDays, format } from 'date-fns'
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

interface Branch { code: string; label: string }
interface Position { name: string; contractMonths: number }

export function EmployeeForm({
  action,
  positions = [],
  branches = [],
}: {
  action: (data: Record<string, string | null>) => Promise<{ success: boolean; error?: string; message?: string; code?: string; fields?: Record<string, string> }>
  positions?: Position[]
  branches?: Branch[]
}) {
  const router = useRouter()
  const [posisi, setPosisi] = useState('')
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  // Kunci sinkron anti double-submit (disabled={isPending} tidak instan karena state async)
  const submittingRef = useRef(false)

  const selectedPosition = positions.find(p => p.name === posisi)

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
      const months = positions.find(p => p.name === posisi)?.contractMonths ?? 6
      // Hari terakhir periode (inklusif): +N bulan lalu mundur 1 hari
      setTglSelesai(format(subDays(addMonths(new Date(tglMulai), months), 1), 'yyyy-MM-dd'))
    }
  }, [posisi, tglMulai, positions])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Cegah double-submit secara sinkron sebelum apa pun berjalan
    if (submittingRef.current) return
    // Buat FormData dari DOM form secara synchronous — ini menjamin
    // semua <input> (termasuk yang dibungkus wrapper component) terkumpul.
    const formData = new FormData(e.currentTarget)

    // Client-side validation - instant feedback before round-trip
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
      toast.error('Ada isian yang belum sesuai - lihat kolom yang ditandai merah')
      // Focus first invalid field
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) {
        const el = document.getElementById(String(firstField))
        el?.focus()
      }
      return
    }

    submittingRef.current = true
    setErrors({})
    setIsPending(true)
    let navigated = false
    try {
      // Kirim plain object (menghindari OpenLiteSpeed multipart bug)
      const res = await action(raw)
      if (res && res.success === false) {
        // Sorot + fokus field yang ditolak server (mis. No KTP duplikat)
        if (res.fields && Object.keys(res.fields).length > 0) {
          setErrors(res.fields)
          const firstField = Object.keys(res.fields)[0]
          if (firstField) document.getElementById(firstField)?.focus()
        }
        toast.error(res.error)
        return
      }
      toast.success('Data karyawan berhasil disimpan')
      navigated = true
      router.push('/karyawan')
    } catch {
      toast.error('Koneksi terputus - coba simpan ulang')
    } finally {
      // Pada sukses, biarkan tombol tetap terkunci sampai halaman pindah.
      // Pada error, buka kunci agar bisa coba lagi.
      if (!navigated) {
        submittingRef.current = false
        setIsPending(false)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">

      {/* ─── A. Data Operasional ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<Buildings size={16} className="text-primary" />}
          letter="A"
          title="Data Operasional"
          color="blue"
        />
        <div className="space-y-2">
          <Label htmlFor="cabang" className="form-label">
            Cabang <span className="text-red-500">*</span>
          </Label>
          <SelectCombobox
            id="cabang"
            name="cabang"
            required
            size="sm"
            options={branches.map(b => ({ value: b.code, label: `${b.code} - ${b.label}` }))}
            placeholder="Pilih cabang..."
          />
          <FieldError message={errors.cabang} />
          <p className="text-xs text-muted-foreground">Kode BA &amp; nama cabang terisi otomatis dari pilihan ini.</p>
        </div>
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
            <DatePicker id="tglLahir" name="tglLahir" required placeholder="Pilih tanggal lahir" size="sm" />
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
              size="sm"
              options={['ADA', 'TIDAK ADA']}
              placeholder="Pilih..."
            />
            <FieldError message={errors.formConsent} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender" className="form-label">
              Jenis Kelamin
            </Label>
            <SelectCombobox
              id="gender"
              name="gender"
              size="sm"
              options={[
                { value: 'L', label: 'L (Laki-laki)' },
                { value: 'P', label: 'P (Perempuan)' },
              ]}
              placeholder="Pilih (opsional)..."
            />
            <FieldError message={errors.gender} />
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
            size="sm"
            value={posisi}
            onValueChange={setPosisi}
            options={positions.map(p => ({
              value: p.name,
              label: p.name,
              hint: `${p.contractMonths} bln`,
            }))}
            placeholder="Pilih jabatan..."
          />
          <FieldError message={errors.posisi} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {/* Row 1: Labels */}
          <Label htmlFor="traineeSejak" className="form-label self-end">
            Mulai Kontrak <span className="text-red-500">*</span>
          </Label>
          <Label htmlFor="traineeSelesai" className="form-label self-end flex items-center gap-1.5">
            Akhir Kontrak
            <span className="text-xs font-normal text-primary bg-accent px-1.5 py-0.5 rounded leading-none">
              Otomatis
            </span>
          </Label>

          {/* Row 2: Inputs */}
          <div>
            <DatePicker
              id="traineeSejak"
              name="traineeSejak"
              required
              size="sm"
              value={tglMulai}
              onValueChange={setTglMulai}
              placeholder="Pilih tanggal mulai"
            />
            <FieldError message={errors.traineeSejak} />
          </div>
          <div className="h-[30px] sm:h-[28px] w-full flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-accent/50 px-3 text-base sm:text-sm font-semibold text-primary">
            <span className="truncate">
              {tglSelesai
                ? format(new Date(tglSelesai), 'EEEE, dd MMM yyyy', { locale: localeID })
                : 'Pilih posisi & tanggal'}
            </span>
            <CalendarCheck size={16} className="opacity-70 shrink-0" />
          </div>
        </div>

        {/* Info tip */}
        {posisi && (
          <div className="flex items-start gap-2 rounded-md bg-accent border border-blue-100 px-4 py-2">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Jabatan <strong>{posisi}</strong> otomatis mendapat kontrak{' '}
              <strong>{selectedPosition?.contractMonths ?? 6} bulan</strong>{' '}
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
      {/* Action bar - menempel di bawah saat scroll (mobile-friendly) */}
      <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-3 bg-card/95 backdrop-blur-sm border-t border-border flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="h-11 px-5 rounded-lg border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? (
            <><CircleNotch size={16} className="animate-spin" /> Menyimpan...</>
          ) : (
            'Simpan Data Karyawan'
          )}
        </button>
      </div>
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
        size="sm"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${error ? 'border-destructive' : ''} ${className ?? ''}`}
        onBlur={onBlur ? (e) => onBlur((e.target as HTMLInputElement).value.trim()) : undefined}
      />
      <FieldError id={`${id}-error`} message={error} />
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
