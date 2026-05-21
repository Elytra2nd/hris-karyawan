'use client'

import { useState, useEffect } from 'react'
import { addMonths, format } from 'date-fns'
import { Info, Building2, User, FileSignature, CalendarCheck, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

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

export function EmployeeForm({ action }: { action: (formData: FormData) => void }) {
  const [posisi, setPosisi] = useState('')
  const [tglMulai, setTglMulai] = useState('')
  const [tglSelesai, setTglSelesai] = useState('')
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (posisi && tglMulai) {
      const opt = POSISI_OPTIONS.find(p => p.value === posisi)
      const months = opt?.months ?? 6
      setTglSelesai(format(addMonths(new Date(tglMulai), months), 'yyyy-MM-dd'))
    }
  }, [posisi, tglMulai])

  const handleSubmit = async (formData: FormData) => {
    setIsPending(true)
    await action(formData)
    // redirect akan terjadi di server action, jadi tidak perlu reset
  }

  return (
    <form action={handleSubmit} className="space-y-8">

      {/* ─── A. Data Operasional ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<Building2 size={15} className="text-primary" />}
          letter="A"
          title="Data Operasional"
          color="blue"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="ba" label="BA (Branch Code)" name="ba" placeholder="Contoh: H730" required />
          <FormField id="baCabang" label="BA Cabang" name="baCabang" placeholder="Contoh: SAMBAS" required />
          <div className="space-y-2">
            <Label htmlFor="region" className="form-label">
              Region <span className="text-red-500">*</span>
            </Label>
            <Select name="region" required>
              <SelectTrigger id="region" className="h-9 text-sm bg-white">
                <SelectValue placeholder="Pilih region..." />
              </SelectTrigger>
              <SelectContent>
                {REGION_OPTIONS.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cabang" className="form-label">
              Cabang <span className="text-red-500">*</span>
            </Label>
            <Select name="cabang" required>
              <SelectTrigger id="cabang" className="h-9 text-sm bg-white">
                <SelectValue placeholder="Pilih cabang..." />
              </SelectTrigger>
              <SelectContent>
                {CABANG_OPTIONS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
          />
          <FormField
            id="nik" label="NIK Karyawan"
            name="nik" placeholder="Diisi oleh HO"
            hint="Bisa dikosongkan dan diisi nanti"
          />
          <FormField
            id="noKtp" label="No KTP"
            name="noKtp" placeholder="16 digit angka" required
            className="font-mono"
          />
          <FormField
            id="tglLahir" label="Tanggal Lahir"
            name="tglLahir" type="date" required
          />
          <FormField
            id="namaIbu" label="Nama Ibu Kandung"
            name="namaIbu" placeholder="Sesuai KTP" required
          />
          <FormField
            id="noHp" label="No HP / WhatsApp"
            name="noHp" placeholder="08xxxxxxxxxx" required
          />
          <FormField
            id="noJamsostek" label="No Jamsostek"
            name="noJamsostek" placeholder="Opsional"
            className="font-mono"
          />
          <div className="space-y-2">
            <Label htmlFor="formConsent" className="form-label">
              Form Consent <span className="text-red-500">*</span>
            </Label>
            <Select name="formConsent" required>
              <SelectTrigger id="formConsent" className="h-9 text-sm bg-white">
                <SelectValue placeholder="Pilih..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADA">ADA</SelectItem>
                <SelectItem value="TIDAK ADA">TIDAK ADA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* ─── C. Kontrak Pertama ─── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<FileSignature size={15} className="text-orange-500" />}
          letter="C"
          title="Kontrak Pertama"
          color="orange"
        />

        <div className="space-y-2">
          <Label htmlFor="posisi" className="form-label">
            Posisi / Jabatan <span className="text-red-500">*</span>
          </Label>
          <Select name="posisi" required onValueChange={setPosisi}>
            <SelectTrigger id="posisi" className="h-9 text-sm bg-white">
              <SelectValue placeholder="Pilih jabatan..." />
            </SelectTrigger>
            <SelectContent>
              {POSISI_OPTIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                  <span className="ml-2 text-xs text-muted-foreground">({p.months} bln)</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="traineeSejak" className="form-label">
              Mulai Kontrak <span className="text-red-500">*</span>
            </Label>
            <Input
              id="traineeSejak"
              name="traineeSejak"
              type="date"
              required
              className="h-9 text-sm"
              onChange={e => setTglMulai(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="traineeSelesai" className="form-label flex items-center gap-1.5">
              Akhir Kontrak
              <span className="text-[10px] font-normal text-primary bg-blue-50 px-1.5 py-0.5 rounded">
                Otomatis
              </span>
            </Label>
            <Input
              id="traineeSelesai"
              name="traineeSelesai"
              type="date"
              readOnly
              value={tglSelesai}
              required={!!tglMulai}
              className="h-9 text-sm bg-blue-50/50 text-primary font-semibold cursor-not-allowed"
            />
          </div>
        </div>

        {/* Info tip */}
        {posisi && (
          <div className="flex items-start gap-2.5 rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
            <Info size={15} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Jabatan <strong>{posisi}</strong> otomatis mendapat kontrak{' '}
              <strong>{POSISI_OPTIONS.find(p => p.value === posisi)?.months} bulan</strong>{' '}
              dari tanggal mulai.
            </p>
          </div>
        )}

        {!posisi && (
          <div className="flex items-start gap-2.5 rounded-md bg-gray-50 border border-gray-200 px-4 py-3">
            <CalendarCheck size={15} className="text-gray-400 shrink-0 mt-0.5" />
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
          <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
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
    blue: 'bg-blue-50 border-blue-100',
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
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
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
}: {
  id: string
  label: string
  name: string
  placeholder?: string
  type?: string
  required?: boolean
  hint?: string
  className?: string
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
        className={`h-9 text-sm ${className ?? ''}`}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
