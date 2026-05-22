'use client'

import { useState, useEffect } from 'react'
import { addMonths, format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Info, CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'

const POSISI_OPTIONS = [
  { value: 'SALESMAN', label: 'Salesman', months: 6 },
  { value: 'ADMINISTRASI', label: 'Administrasi', months: 3 },
  { value: 'SUPERVISOR', label: 'Supervisor', months: 6 },
  { value: 'MANAGER', label: 'Manager', months: 6 },
  { value: 'STAFF IT', label: 'Staff IT', months: 6 },
  { value: 'TEKNISI', label: 'Teknisi', months: 6 },
]

interface ContractFormProps {
  employeeId: string
  action: (id: string, formData: FormData) => Promise<void>
}

export function ContractForm({ employeeId, action }: ContractFormProps) {
  const [posisi, setPosisi] = useState('')
  const [tglMulai, setTglMulai] = useState(format(new Date(), 'yyyy-MM-dd'))
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
    try {
      await action(employeeId, formData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server'
      toast.error(msg)
      setIsPending(false)
    }
  }

  const selectedOpt = POSISI_OPTIONS.find(p => p.value === posisi)

  return (
    <form action={handleSubmit} className="space-y-5">

      {/* Posisi */}
      <div className="space-y-2">
        <Label htmlFor="posisi" className="form-label">
          Posisi / Jabatan Baru <span className="text-red-500">*</span>
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

      {/* Tanggal */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="traineeSejak" className="form-label">
            Mulai Kontrak <span className="text-red-500">*</span>
          </Label>
          <Input
            id="traineeSejak"
            name="traineeSejak"
            type="date"
            value={tglMulai}
            onChange={e => setTglMulai(e.target.value)}
            required
            className="h-9 text-sm"
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
            value={tglSelesai}
            readOnly
            required={!!tglMulai && !!posisi}
            className="h-9 text-sm bg-blue-50/50 text-primary font-semibold cursor-not-allowed"
          />
        </div>
      </div>

      {/* Info tip */}
      {posisi ? (
        <div className="flex items-start gap-2.5 rounded-md bg-blue-50 border border-blue-100 px-3.5 py-3">
          <Info size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            Jabatan <strong>{selectedOpt?.label}</strong> mendapat kontrak{' '}
            <strong>{selectedOpt?.months} bulan</strong> dari tanggal mulai.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-md bg-gray-50 border border-gray-200 px-3.5 py-3">
          <CalendarCheck size={14} className="text-gray-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Pilih jabatan untuk menghitung tanggal akhir kontrak secara otomatis.
          </p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || !posisi || !tglMulai}
        className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {isPending ? (
          <><Loader2 size={15} className="animate-spin" /> Menerbitkan...</>
        ) : (
          'Terbitkan Kontrak Baru'
        )}
      </button>
    </form>
  )
}
