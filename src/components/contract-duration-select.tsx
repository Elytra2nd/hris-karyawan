'use client'

import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'

/** Pilihan durasi yang selalu tersedia, di luar bawaan posisi. */
const DURASI_UMUM = [3, 6, 12]

/**
 * Pemilih durasi kontrak (bulan).
 *
 * Sebelumnya durasi terkunci pada `Position.contractMonths`, satu jabatan =
 * satu durasi tetap. Permintaan Bu Yanti (03 Sep 2026): jabatan LAINNYA untuk
 * penempatan non-permanen bisa 3 ATAU 6 bulan.
 *
 * Dibuat sbg pilihan per-kontrak, bukan dgn membuat posisi terpisah per durasi
 * ("LAINNYA (3 BLN)"), karena nama jabatan ikut tercetak di export dan dokumen
 * perjanjian — durasi bukan bagian dari nama jabatan. Cara ini juga berlaku
 * untuk semua jabatan lain kalau sewaktu-waktu perlu menyimpang.
 *
 * Nilai bawaan tetap mengikuti posisi, jadi alur normal tak berubah: user yang
 * tidak menyentuh field ini mendapat durasi yang sama seperti sebelumnya.
 */
export function ContractDurationSelect({
  value,
  onChange,
  positionMonths,
  disabled,
}: {
  value: number | ''
  onChange: (bulan: number) => void
  /** Durasi bawaan jabatan terpilih; undefined = jabatan belum dipilih. */
  positionMonths?: number
  disabled?: boolean
}) {
  const opsi = [...new Set([...(positionMonths ? [positionMonths] : []), ...DURASI_UMUM])].sort(
    (a, b) => a - b,
  )

  return (
    <div className="space-y-2">
      <Label htmlFor="durasiBulan" className="form-label h-5 flex items-center">
        Durasi Kontrak
      </Label>
      <NativeSelect
        id="durasiBulan"
        name="durasiBulan"
        containerClassName="w-full"
        className="h-10"
        value={value === '' ? '' : String(value)}
        disabled={disabled}
        onChange={e => onChange(Number(e.target.value))}
        aria-describedby="durasiBulan-hint"
      >
        {opsi.map(m => (
          <option key={m} value={m}>
            {m} bulan{m === positionMonths ? ' (bawaan jabatan)' : ''}
          </option>
        ))}
      </NativeSelect>
      <p id="durasiBulan-hint" className="text-xs text-muted-foreground/70">
        {disabled
          ? 'Pilih jabatan dulu.'
          : 'Ubah hanya bila kontrak ini menyimpang dari durasi bawaan jabatan.'}
      </p>
    </div>
  )
}
