'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, MicrosoftExcelLogoIcon, WarningCircle, CheckCircle,
  CircleNotch, Download, X, WarningIcon, CaretDown, MagnifyingGlass,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { bulkImportEmployees, type ImportRow } from '@/app/actions/import'
import { getBranches } from '@/app/actions/branch'
import { getPositions } from '@/app/actions/position'
import { normalizeRow, COL_MAP } from '@/lib/import-utils'
import { importEmployeeSchema } from '@/lib/validation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type RowStatus = 'pending' | 'ok' | 'error'
interface PreviewRow {
  index: number
  raw: Record<string, string>            // sesuai header asli (dikirim ke server)
  norm: Record<string, string | null>    // ter-normalisasi (untuk tampilan preview)
  status: RowStatus
  error?: string
}

// Template DIGENERATE dari data DB asli (branch & posisi) supaya dropdown dan
// daftar di petunjuk selalu sinkron dengan sistem - bukan nilai hardcode lama.
export function downloadTemplate(
  branches: { code: string; label: string }[] = [],
  positions: { name: string; contractMonths: number }[] = [],
) {
  const wb = XLSX.utils.book_new()

  // ═══════════════════════════════════════════════════════════════════════
  // SHEET 1: Data Karyawan (main template)
  // ═══════════════════════════════════════════════════════════════════════

  const legend = ['★ = Wajib diisi  |  ○ = Opsional  |  Isi data mulai baris 4  |  Jangan ubah nama kolom']

  // Header (urutan = urutan kolom). ★ wajib, ○ opsional (mengikuti importer).
  const headers = [
    '★ BA', '★ BA CABANG', '★ CABANG', '★ NAMA LENGKAP', '○ NIK',
    '★ NO KTP', '○ TGL LAHIR', '★ NAMA IBU', '○ NO HP',
    '○ NO JAMSOSTEK', '○ FORM CONSENT', '★ POSISI', '★ TRAINEE SEJAK',
    '○ TRAINEE SELESAI', '○ GENDER', '○ NO PERJANJIAN',
  ]

  const subHeaders = [
    'kode cabang', 'nama cabang', 'dropdown', 'min 2 char', 'maks 20 char',
    '16 digit angka', 'dd.MM.yyyy', 'min 2 char', '08xxx (opsional)',
    'maks 30 char', 'dropdown', 'dropdown', 'dd.MM.yyyy',
    'dd.MM.yyyy (opsional)', 'L / P', 'opsional',
  ]

  // Contoh data dari branch & posisi NYATA di sistem.
  const exB = branches.length ? branches.slice(0, 3) : [{ code: 'KETAPANG', label: 'KETAPANG' }]
  const exP = positions.length ? positions.map(p => p.name) : ['SALES EXECUTIVE']
  const sampleNames = ['Budi Santoso', 'Dewi Lestari', 'Ahmad Wijaya']
  const sampleKtp = ['6171012345670001', '6104034567890002', '6172056789010003']
  const sampleBirth = ['15.03.1998', '22.08.2000', '10.11.1995']
  const sampleIbu = ['Siti Aminah', 'Nur Hasanah', 'Kartini']
  const sampleHp = ['081234567890', '085298765432', '082112345678']
  const examples = exB.map((b, i) => [
    b.code, b.label, b.code, sampleNames[i] ?? 'Nama Karyawan',
    i === 1 ? '' : `${1234 + i}`, sampleKtp[i] ?? '', sampleBirth[i] ?? '',
    sampleIbu[i] ?? '', sampleHp[i] ?? '', i === 1 ? '' : `JST${10234567 + i}`,
    i === 1 ? 'TIDAK ADA' : 'ADA', exP[i % exP.length], `0${i + 1}.07.2024`,
    '', i === 1 ? 'P' : 'L', i === 1 ? '' : `LO.PERJ/HRD/00${i + 1}/VII/2024`,
  ])

  const ws = XLSX.utils.aoa_to_sheet([legend, headers, subHeaders, ...examples])
  const lastCol = headers.length - 1
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }]
  ws['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 10 },
    { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 9 }, { wch: 26 },
  ]
  ws['!freeze'] = { xSplit: 0, ySplit: 3 }

  // Dropdown validations - daftar dari DB asli.
  const branchCodes = branches.map(b => b.code).join(',')
  const positionNames = positions.map(p => p.name).join(',')
  const validations: Array<{
    type: string; sqref: string; formulas: string[];
    showErrorMessage: boolean; errorTitle: string; error: string;
  }> = []
  if (branchCodes) validations.push({
    type: 'list', sqref: 'C4:C5002', formulas: [branchCodes],
    showErrorMessage: true, errorTitle: 'Cabang Tidak Valid',
    error: 'Pilih kode cabang yang tersedia di sistem',
  })
  validations.push({
    type: 'list', sqref: 'K4:K5002', formulas: ['ADA,TIDAK ADA'],
    showErrorMessage: true, errorTitle: 'Form Consent Tidak Valid',
    error: 'Pilih: ADA atau TIDAK ADA',
  })
  if (positionNames) validations.push({
    type: 'list', sqref: 'L4:L5002', formulas: [positionNames],
    showErrorMessage: true, errorTitle: 'Posisi Tidak Valid',
    error: 'Pilih posisi yang tersedia dari dropdown',
  })
  validations.push({
    type: 'list', sqref: 'O4:O5002', formulas: ['L,P'],
    showErrorMessage: true, errorTitle: 'Gender Tidak Valid',
    error: 'Pilih: L atau P',
  })
  ws['!dataValidations'] = { list: validations }

  XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan')

  // ═══════════════════════════════════════════════════════════════════════
  // SHEET 2: Petunjuk Pengisian
  // ═══════════════════════════════════════════════════════════════════════
  const positionListStr = positions.length
    ? positions.map(p => p.name).join(', ')
    : '(belum ada posisi - tambahkan di Kelola Posisi)'

  const guideData: (string | number)[][] = [
    ['PETUNJUK PENGISIAN TEMPLATE IMPORT KARYAWAN'],
    ['Astra Trainee Monitoring System (ATMS) - Astra Motor Kalimantan Barat'],
    [''],
    ['ATURAN UMUM'],
    ['1. Isi data mulai dari baris ke-4 (baris 1 = legenda, baris 2 = header, baris 3 = keterangan format)'],
    ['2. JANGAN mengubah nama kolom di baris 2'],
    ['3. Kolom bertanda ★ wajib diisi, kolom bertanda ○ opsional'],
    ['4. Maksimal 5000 baris per import'],
    ['5. No KTP yang sama di banyak baris = 1 karyawan dengan banyak riwayat kontrak (perpanjangan)'],
    ['6. Tanggal boleh format dd.MM.yyyy, dd/MM/yyyy, atau 01-Mei-2022 (nama bulan)'],
    [''],
    ['KOLOM', 'WAJIB', 'FORMAT', 'KETERANGAN'],
    ['BA', 'Ya', 'Teks', 'Kode Business Area / kode cabang'],
    ['BA CABANG', 'Ya', 'Teks', 'Nama cabang (otomatis dicocokkan ke sistem)'],
    ['CABANG', 'Ya', 'Dropdown', 'Kode cabang yang terdaftar di sistem'],
    ['NAMA LENGKAP', 'Ya', 'Teks (2-100 karakter)', 'Nama lengkap karyawan sesuai KTP'],
    ['NIK', 'Tidak', 'Teks (maks 20 karakter)', 'Nomor Induk Karyawan internal, boleh kosong'],
    ['NO KTP', 'Ya', 'Angka (tepat 16 digit)', 'Nomor KTP / NIK nasional, harus unik'],
    ['TGL LAHIR', 'Tidak', 'dd.MM.yyyy', 'Tanggal lahir. Boleh kosong, dilengkapi nanti'],
    ['NAMA IBU', 'Ya', 'Teks (2-100 karakter)', 'Nama ibu kandung'],
    ['NO HP', 'Tidak', 'Angka (08xxx)', 'Nomor HP aktif. Boleh kosong'],
    ['NO JAMSOSTEK', 'Tidak', 'Teks (maks 30 karakter)', 'Nomor BPJS Ketenagakerjaan, boleh kosong'],
    ['FORM CONSENT', 'Tidak', 'ADA / TIDAK ADA', 'Status form consent. Boleh kosong'],
    ['POSISI', 'Ya', 'Pilih dari dropdown', positionListStr],
    ['TRAINEE SEJAK', 'Ya', 'dd.MM.yyyy', 'Tanggal mulai kontrak'],
    ['TRAINEE SELESAI', 'Tidak', 'dd.MM.yyyy', 'Tanggal selesai. Kosong = dihitung otomatis dari durasi posisi'],
    ['GENDER', 'Tidak', 'L / P', 'Jenis kelamin (L = Laki-laki, P = Perempuan)'],
    ['NO PERJANJIAN', 'Tidak', 'Teks', 'Nomor surat perjanjian kontrak'],
    [''],
    ['KODE CABANG TERSEDIA'],
    ['Kode', 'Nama Cabang'],
    ...branches.map(b => [b.code, b.label]),
    [''],
    ['PERHITUNGAN KONTRAK OTOMATIS (jika TRAINEE SELESAI kosong)'],
    ['Posisi', 'Durasi Kontrak'],
    ...positions.map(p => [p.name, `${p.contractMonths} bulan dari Trainee Sejak`]),
  ]

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 28 }, { wch: 65 }]
  wsGuide['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ]

  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk')

  XLSX.writeFile(wb, 'Template_Import_Karyawan_ATMS.xlsx')
}

export function ImportExcelButton() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState<{ created: number; contractsAdded: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Branch & posisi dari DB - untuk men-generate template yang sinkron sistem.
  const [branches, setBranches] = useState<{ code: string; label: string }[]>([])
  const [positions, setPositions] = useState<{ name: string; contractMonths: number }[]>([])
  useEffect(() => {
    getBranches().then(bs => setBranches(bs.map(b => ({ code: b.code, label: b.label }))))
    getPositions().then(ps => setPositions(ps.map(p => ({ name: p.name, contractMonths: p.contractMonths }))))
  }, [])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer)
      // cellDates: sel tanggal Excel dibaca sebagai objek Date (bukan serial)
      const wb = XLSX.read(data, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]

      // Read all rows as raw arrays to find the actual header row
      const rawRows: (string | number | Date)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      // Find header row: baris yang sel-selnya dikenali sebagai kolom (lewat
      // COL_MAP, jadi header Bahasa Indonesia template MAUPUN Bahasa Inggris
      // sistem lama sama-sama terdeteksi). Dianggap header bila ≥3 kolom dikenal.
      let headerIdx = -1
      for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
        const recognized = new Set(
          rawRows[i]
            .map((c) => COL_MAP[String(c).replace(/^[★○]\s*/, '').toUpperCase().trim()])
            .filter(Boolean)
        )
        if (recognized.size >= 3) {
          headerIdx = i
          break
        }
      }

      if (headerIdx === -1) {
        // Fallback: use first row as header
        headerIdx = 0
      }

      // Build header keys from the detected header row
      const headerKeys = rawRows[headerIdx].map((c) =>
        String(c).replace(/^[★○]\s*/, '').toUpperCase().trim()
      )

      // Skip legend, header, and sub-header rows - find where data actually starts
      // Data starts after header + 1 (sub-header row, if it looks like format hints)
      let dataStart = headerIdx + 1
      if (dataStart < rawRows.length) {
        const nextRow = rawRows[dataStart].map((c) => String(c).toLowerCase().trim())
        const looksLikeSubHeader = nextRow.some(v =>
          v.includes('wajib') || v.includes('opsional') || v.includes('dropdown') ||
          v.includes('maks') || v.includes('min ') || v.includes('dd.mm')
        )
        if (looksLikeSubHeader) dataStart++
      }

      // Ubah sel ke teks. Sel tanggal (Date dari cellDates) → ISO yyyy-MM-dd.
      const cellToText = (cell: unknown): string => {
        if (cell instanceof Date && !isNaN(cell.getTime())) {
          const yyyy = cell.getFullYear()
          const mm = String(cell.getMonth() + 1).padStart(2, '0')
          const dd = String(cell.getDate()).padStart(2, '0')
          return `${yyyy}-${mm}-${dd}`
        }
        return String(cell ?? '').trim()
      }

      // Map remaining rows to objects using header keys
      const dataRows = rawRows.slice(dataStart)
      const normalizedRaw = dataRows
        .filter(row => row.some((c) => String(c).trim() !== ''))  // skip blank rows
        .map(row => {
          const out: Record<string, string> = {}
          headerKeys.forEach((key, idx) => {
            if (key) out[key] = cellToText(row[idx])
          })
          return out
        })

      // Cross-check master data (cabang & posisi) MIRROR server, supaya baris
      // "Siap" benar-benar akan lolos saat impor - bukan cuma lolos schema.
      const branchByCode = new Map(branches.map(b => [b.code.toUpperCase(), b]))
      const branchByLabel = new Map(branches.map(b => [b.label.toUpperCase(), b]))
      const resolveBranchLocal = (...cands: (string | null | undefined)[]) => {
        for (const c of cands) {
          if (!c) continue
          const up = c.toUpperCase().trim()
          if (branchByCode.get(up) ?? branchByLabel.get(up)) return true
        }
        return false
      }
      const posSet = new Set(positions.map(p => p.name.toUpperCase()))

      // Validasi preview memakai schema yang SAMA dengan server (lewat normalizeRow),
      // sehingga baris yang tampil "Siap" pasti lolos saat diimpor (bukan cuma cek kolom kosong).
      const preview: PreviewRow[] = normalizedRaw.map((raw, i) => {
        const norm = normalizeRow(raw)
        const parsed = importEmployeeSchema.safeParse(norm)
        if (!parsed.success) {
          return { index: i, raw, norm, status: 'error', error: parsed.error.issues[0]?.message ?? 'Data tidak valid' }
        }
        // Cek cabang (kalau master data sudah termuat)
        if (branches.length && !resolveBranchLocal(norm.cabang, norm.ba, norm.baCabang)) {
          return { index: i, raw, norm, status: 'error', error: `Cabang "${norm.cabang ?? '-'}" tidak terdaftar di sistem` }
        }
        // Cek posisi
        if (positions.length && norm.posisi && !posSet.has(norm.posisi.toUpperCase())) {
          return { index: i, raw, norm, status: 'error', error: `Posisi "${norm.posisi}" tidak terdaftar di sistem` }
        }
        // Cek tanggal selesai tidak mendahului mulai
        if (norm.traineeSelesai && norm.traineeSejak && new Date(norm.traineeSelesai) < new Date(norm.traineeSejak)) {
          return { index: i, raw, norm, status: 'error', error: `Tanggal selesai lebih awal dari tanggal mulai` }
        }
        return { index: i, raw, norm, status: 'pending' }
      })

      setRows(preview)
      setOpen(true)
    }
    reader.readAsArrayBuffer(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const validRows = rows.filter(r => r.status !== 'error')
  const errorRows = rows.filter(r => r.status === 'error')
  // Estimasi jumlah karyawan = KTP unik di antara baris siap (1 KTP = 1 karyawan,
  // banyak baris = banyak kontrak). Memberi gambaran hasil grouping di server.
  const employeeCount = useMemo(
    () => new Set(validRows.map(r => r.norm.noKtp).filter(Boolean)).size,
    [validRows],
  )

  // Filter preview (memudahkan saat baris banyak): status + cari nama/KTP
  const [rowFilter, setRowFilter] = useState<'all' | 'ok' | 'error'>('all')
  const [rowSearch, setRowSearch] = useState('')
  const displayedRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase()
    return rows.filter(r => {
      const matchStatus =
        rowFilter === 'all' ? true
          : rowFilter === 'error' ? r.status === 'error'
            : r.status !== 'error'
      const matchSearch = !q
        || (r.norm.namaLengkap ?? '').toLowerCase().includes(q)
        || (r.norm.noKtp ?? '').includes(rowSearch.trim())
      return matchStatus && matchSearch
    })
  }, [rows, rowFilter, rowSearch])

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)

    const importRows: ImportRow[] = validRows.map(r => ({ index: r.index, raw: r.raw }))

    try {
      const result = await bulkImportEmployees(importRows)

      // Update row statuses based on server errors
      const serverErrorMap = new Map(result.errors.map(e => [e.row - 1, e.message]))
      setRows(prev => prev.map(r => {
        if (r.status === 'error') return r // already client-side error
        const serverErr = serverErrorMap.get(r.index)
        if (serverErr) return { ...r, status: 'error', error: serverErr }
        return { ...r, status: 'ok' }
      }))

      setDone({ created: result.created, contractsAdded: result.contractsAdded, skipped: result.skipped })

      if (result.created > 0 || result.contractsAdded > 0) {
        toast.success(`${result.created} karyawan baru, ${result.contractsAdded} kontrak diimport`)
      }
      if (result.skipped > 0) {
        toast.warning(`${result.skipped} baris dilewati (cek error di tabel)`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Import gagal')
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setRows([])
    setFileName('')
    setDone(null)
    setRowFilter('all')
    setRowSearch('')
    setOpen(false)
  }

  // Tampilkan dari data ter-normalisasi (field kanonik) agar terbaca apa pun
  // bahasa header file sumber (template Indonesia / export Inggris).
  const displayCols: { key: string; label: string }[] = [
    { key: 'namaLengkap', label: 'NAMA LENGKAP' },
    { key: 'noKtp', label: 'NO KTP' },
    { key: 'cabang', label: 'CABANG' },
    { key: 'posisi', label: 'POSISI' },
    { key: 'traineeSejak', label: 'TRAINEE SEJAK' },
  ]

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />

      <div className="relative">
        <div className="flex">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 h-8 px-4 text-sm font-semibold text-primary bg-accent border border-blue-200 rounded-l-lg hover:bg-blue-100 transition-colors"
          >
            <Upload size={16} />
            Import Excel
          </button>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center h-8 px-2 text-primary bg-accent border border-l-0 border-blue-200 rounded-r-lg hover:bg-blue-100 transition-colors"
          >
            <CaretDown size={12} />
          </button>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              onKeyDown={e => e.key === 'Escape' && setMenuOpen(false)}
              role="button"
              tabIndex={-1}
              aria-label="Tutup menu"
            />
            <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
              <button
                onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
              >
                <Upload size={16} className="text-primary shrink-0" />
                <div>
                  <p className="font-semibold">Import File Excel</p>
                  <p className="text-xs text-muted-foreground">Upload data karyawan (.xlsx)</p>
                </div>
              </button>
              <div className="mx-3 my-1 border-t border-border/60" />
              <button
                onClick={() => { downloadTemplate(branches, positions); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
              >
                <Download size={16} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold">Download Template</p>
                  <p className="text-xs text-muted-foreground">File contoh format import</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={v => { if (!v) reset() }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60">
            <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <MicrosoftExcelLogoIcon size={20} className="text-primary" />
              Import Data Karyawan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {fileName && <span className="font-medium">{fileName}</span>} - {rows.length} baris terdeteksi
            </DialogDescription>
          </DialogHeader>

          {/* Summary bar */}
          <div className="flex items-center gap-4 px-6 py-2 bg-muted/50 border-b border-border/60 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-green-700">
              <CheckCircle size={12} /> {validRows.length} baris siap
              {employeeCount > 0 && <span className="text-green-700/70 font-normal">≈ {employeeCount} karyawan</span>}
            </span>
            <span className="flex items-center gap-1.5 text-red-600">
              <WarningCircle size={12} /> {errorRows.length} error
            </span>
            {done && (
              <span className="ml-auto flex items-center gap-1.5 text-primary">
                <CheckCircle size={12} /> Selesai: {done.created} karyawan, {done.contractsAdded} kontrak, {done.skipped} dilewati
              </span>
            )}
            <button
              onClick={() => downloadTemplate(branches, positions)}
              className="ml-auto flex items-center gap-1 text-muted-foreground/70 hover:text-foreground/80 transition-colors font-medium"
            >
              <Download size={12} /> Download Template
            </button>
          </div>

          {/* Filter bar - memudahkan menelusuri baris saat data banyak */}
          {rows.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 px-6 py-2 border-b border-border/60 bg-card">
              <div className="relative">
                <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                <input
                  value={rowSearch}
                  onChange={e => setRowSearch(e.target.value)}
                  placeholder="Cari nama / No KTP..."
                  aria-label="Cari baris import"
                  className="h-8 pl-7 pr-3 w-52 text-base sm:text-xs border border-border/80 rounded-lg bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                />
              </div>
              <div className="flex items-center gap-1 ml-auto">
                {([
                  ['all', `Semua (${rows.length})`],
                  ['ok', `Siap (${validRows.length})`],
                  ['error', `Error (${errorRows.length})`],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRowFilter(key)}
                    className={cn(
                      'h-8 px-3 text-xs font-semibold rounded-lg border transition-colors',
                      rowFilter === key
                        ? key === 'error'
                          ? 'bg-red-500/10 border-red-300 text-red-600'
                          : key === 'ok'
                            ? 'bg-emerald-500/10 border-emerald-300 text-emerald-700'
                            : 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white w-10">#</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white w-20">Status</th>
                  {displayCols.map(c => (
                    <th key={c.key} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.length === 0 && (
                  <tr>
                    <td colSpan={displayCols.length + 3} className="px-3 py-8 text-center text-muted-foreground">
                      Tidak ada baris yang cocok dengan filter
                    </td>
                  </tr>
                )}
                {displayedRows.map((row, i) => (
                  <tr
                    key={row.index}
                    className={cn(
                      'border-b border-border/60',
                      row.status === 'error' ? 'bg-red-50' : row.status === 'ok' ? 'bg-green-50' : i % 2 === 0 ? 'bg-card' : 'bg-muted/60'
                    )}
                  >
                    <td className="px-3 py-2 text-muted-foreground/70 font-mono">{row.index + 1}</td>
                    <td className="px-3 py-2">
                      {row.status === 'error' && <span className="inline-flex items-center gap-1 text-red-600 font-bold"><WarningCircle size={12} /> Error</span>}
                      {row.status === 'ok' && <span className="inline-flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={12} /> OK</span>}
                      {row.status === 'pending' && <span className="text-muted-foreground/70">Siap</span>}
                    </td>
                    {displayCols.map(c => (
                      <td key={c.key} className="px-3 py-2 text-foreground/80 whitespace-nowrap max-w-[160px] truncate">
                        {row.norm[c.key] || <span className="text-muted-foreground/50">-</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-red-600 text-xs">{row.error || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-2 border-t border-border/60 bg-card">
            {errorRows.length > 0 && !done && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                <WarningIcon size={12} />
                {errorRows.length} baris bermasalah akan dilewati
              </div>
            )}
            {done && (
              <div className="text-xs text-muted-foreground">Import selesai.</div>
            )}
            {!errorRows.length && !done && <div />}

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={reset}>
                <X size={12} className="mr-1" /> Tutup
              </Button>
              {!done && (
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="gap-1.5"
                >
                  {importing
                    ? <><CircleNotch size={12} className="animate-spin" /> Mengimport...</>
                    : <><Upload size={12} /> Import {validRows.length} Baris</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
