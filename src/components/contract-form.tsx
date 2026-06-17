'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addMonths, format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SelectCombobox } from '@/components/ui/select-combobox'
import { DatePicker } from '@/components/ui/date-picker'
import { FieldError } from '@/components/ui/field-error'
import { id as localeID } from 'date-fns/locale'
import { CircleNotch, Info, CalendarCheck } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { createContractSchema } from '@/lib/validation'

const POSISI_OPTIONS = [
  { value: 'SALES EXECUTIVE', label: 'Sales Executive', months: 6 },
  { value: 'SALESGIRL', label: 'Salesgirl', months: 6 },
  { value: 'COUNTER SALES', label: 'Counter Sales', months: 6 },
  { value: 'MECHANIC', label: 'Mechanic', months: 6 },
  { value: 'TEAM LEADER', label: 'Team Leader', months: 6 },
  { value: 'ADMINISTRATOR', label: 'Administrator', months: 3 },
]

import type { ActionResult } from '@/lib/result'

interface ContractFormProps {
  employeeId: string
  action: (id: string, formData: FormData) => Promise<ActionResult<{ employeeId: string }>>
}

export function ContractForm({ employeeId, action }: ContractFormProps) {
  const router = useRouter()
  const [posisi, setPosisi] = useState('')
  const [tglMulai, setTglMulai] = useState(format(new Date(), 'yyyy-MM-dd'))
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
    // Client-side Zod validation
    const raw: Record<string, string | null> = {}
    formData.forEach((v, k) => {
      const s = v.toString().trim()
      raw[k] = s === '' ? null : s
    })

    const parsed = createContractSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach(e => {
        const field = e.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = e.message
      })
      setErrors(fieldErrors)
      toast.error('Ada isian yang belum sesuai - lihat kolom yang ditandai merah')
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) document.getElementById(String(firstField))?.focus()
      return
    }

    setErrors({})
    setIsPending(true)
    try {
      const result = await action(employeeId, formData)
      if (result.success) {
        toast.success(result.message ?? 'Kontrak berhasil diterbitkan')
        router.push(`/karyawan/${employeeId}`)
      } else {
        toast.error(result.error)
        setIsPending(false)
      }
    } catch (err: unknown) {
      const msg = 'Koneksi terputus - coba kirim ulang'
      toast.error(msg)
      setIsPending(false)
    }
  }

  const selectedOpt = POSISI_OPTIONS.find(p => p.value === posisi)

  return (
    <form action={handleSubmit} noValidate className="space-y-6">

      {/* Posisi */}
      <div className="space-y-2">
        <Label htmlFor="posisi" className="form-label">
          Posisi / Jabatan Baru <span className="text-red-500">*</span>
        </Label>
        <SelectCombobox
          id="posisi"
          name="posisi"
          required
          value={posisi}
          onValueChange={(v) => { setPosisi(v); setErrors(prev => { const n = { ...prev }; delete n.posisi; return n }) }}
          options={POSISI_OPTIONS.map(p => ({
            value: p.value,
            label: p.label,
            hint: `${p.months} bln`,
          }))}
          placeholder="Pilih jabatan..."
        />
        <FieldError id="posisi-error" message={errors.posisi} />
      </div>

      {/* Tanggal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="traineeSejak" className="form-label">
            Mulai Kontrak <span className="text-red-500">*</span>
          </Label>
          <DatePicker
            id="traineeSejak"
            name="traineeSejak"
            required
            value={tglMulai}
            onValueChange={(v) => { setTglMulai(v); setErrors(prev => { const n = { ...prev }; delete n.traineeSejak; return n }) }}
            placeholder="Pilih tanggal mulai"
          />
          <FieldError id="traineeSejak-error" message={errors.traineeSejak} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="traineeSelesai" className="form-label flex items-center gap-1.5">
            Akhir Kontrak
            <span className="text-xs font-normal text-primary bg-accent px-1.5 py-0.5 rounded">
              Otomatis
            </span>
          </Label>
          <div className="h-8 inline-flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-accent/50 px-4 text-sm font-semibold text-primary">
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
      {posisi ? (
        <div className="flex items-start gap-2 rounded-md bg-accent border border-blue-100 px-4 py-2">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Jabatan <strong>{selectedOpt?.label}</strong> mendapat kontrak{' '}
            <strong>{selectedOpt?.months} bulan</strong> dari tanggal mulai.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-md bg-muted/50 border border-border px-4 py-2">
          <CalendarCheck size={16} className="text-muted-foreground/70 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Pilih jabatan untuk menghitung tanggal akhir kontrak secara otomatis.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !posisi || !tglMulai}
        className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isPending ? (
          <><CircleNotch size={16} className="animate-spin" /> Menerbitkan...</>
        ) : (
          'Terbitkan Kontrak Baru'
        )}
      </button>
    </form>
  )
}

