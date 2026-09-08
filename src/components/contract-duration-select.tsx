'use client'

import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import { durasiBisaDipilih } from '@/lib/contract'

/** Pilihan durasi untuk LAINNYA. Bu Yanti menyebut 3 atau 6; 12 ikut karena
 *  penempatan setahun juga terjadi dan menambahkannya tak menambah risiko. */
const DURASI_LAINNYA = [3, 6, 12]

/**
 * Durasi kontrak (bulan) — hanya untuk jabatan `LAINNYA`.
 *
 * Durasi mengikuti bawaan jabatan, dan hanya LAINNYA yang boleh memilih sendiri
 * (permintaan Bu Yanti, 03 Sep 2026 — penempatan non-permanen bisa 3 atau 6
 * bulan). Untuk jabatan lain komponen ini TIDAK merender apa-apa: durasinya
 * sudah disebut kotak info di bawah form ("Jabatan X mendapat kontrak N bulan"),
 * jadi menampilkan field mati di sini cuma menduplikasi keterangan yang sama
 * sambil mengundang orang mengkliknya.
 *
 * Penegakannya ada di server (`resolveContractMonths`) — komponen ini hanya
 * menghindarkan user dari pilihan yang memang tak berlaku.
 */
export function ContractDurationSelect({
  value,
  onChange,
  posisi,
  positionMonths,
}: {
  value: number | ''
  onChange: (bulan: number) => void
  /** Nama jabatan terpilih; kosong = belum dipilih. */
  posisi: string
  /** Durasi bawaan jabatan terpilih; undefined = jabatan belum dipilih. */
  positionMonths?: number
}) {
  if (!durasiBisaDipilih(posisi)) return null

  const opsi = [...new Set([...(positionMonths ? [positionMonths] : []), ...DURASI_LAINNYA])].sort(
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
        onChange={e => onChange(Number(e.target.value))}
        aria-describedby="durasiBulan-hint"
      >
        {opsi.map(m => (
          <option key={m} value={m}>
            {m} bulan{m === positionMonths ? ' (bawaan)' : ''}
          </option>
        ))}
      </NativeSelect>
      <p id="durasiBulan-hint" className="text-xs text-muted-foreground/70">
        Tentukan berapa lama penempatan ini berjalan.
      </p>
    </div>
  )
}
