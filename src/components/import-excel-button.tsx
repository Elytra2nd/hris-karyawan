'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, MicrosoftExcelLogoIcon, WarningCircle, CheckCircle,
  CircleNotch, Download, X, WarningIcon, CaretDown,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { bulkImportEmployees, type ImportRow } from '@/app/actions/import'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type RowStatus = 'pending' | 'ok' | 'error'
interface PreviewRow {
  index: number
  raw: Record<string, string>
  status: RowStatus
  error?: string
}

const REQUIRED_COLS = ['BA', 'BA CABANG', 'CABANG', 'NAMA LENGKAP', 'NO KTP', 'TGL LAHIR', 'NAMA IBU', 'NO HP', 'FORM CONSENT', 'POSISI', 'TRAINEE SEJAK']

export function downloadTemplate() {
  const wb = XLSX.utils.book_new()

  // ═══════════════════════════════════════════════════════════════════════
  // SHEET 1: Data Karyawan (main template)
  // ═══════════════════════════════════════════════════════════════════════

  // Legenda baris 1
  const legend = ['★ = Wajib diisi  |  ○ = Opsional  |  Isi data mulai baris 4  |  Jangan ubah nama kolom']

  // Header dengan simbol wajib/opsional
  const headers = [
    '★ BA', '★ BA CABANG', '★ CABANG', '★ NAMA LENGKAP', '○ NIK',
    '★ NO KTP', '★ TGL LAHIR', '★ NAMA IBU', '★ NO HP',
    '○ NO JAMSOSTEK', '★ FORM CONSENT', '★ POSISI', '★ TRAINEE SEJAK',
  ]

  // Keterangan format di baris ke-3
  const subHeaders = [
    'maks 20 char', 'maks 100 char', 'dropdown', 'min 2 char', 'maks 20 char',
    '16 digit angka', 'dd.MM.yyyy', 'min 2 char', '08xxx (10-15 digit)',
    'maks 30 char', 'dropdown', 'dropdown', 'dd.MM.yyyy',
  ]

  // 3 baris contoh data realistis
  const examples = [
    ['H720', 'REGION PONTIANAK', 'H720', 'Budi Santoso', '1234', '6171012345670001', '15.03.1998', 'Siti Aminah', '081234567890', 'JST10234567', 'ADA', 'SALES EXECUTIVE', '01.07.2024'],
    ['H721', 'KETAPANG', 'H721', 'Dewi Lestari', '', '6104034567890002', '22.08.2000', 'Nur Hasanah', '085298765432', '', 'TIDAK ADA', 'COUNTER SALES', '15.08.2024'],
    ['H723', 'SINGKAWANG', 'H723', 'Ahmad Wijaya', '5678', '6172056789010003', '10.11.1995', 'Kartini', '082112345678', 'JST20345678', 'ADA', 'MECHANIC', '01.09.2024'],
  ]

  const wsData = [legend, headers, subHeaders, ...examples]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Merge legend row
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }]

  // Column widths
  ws['!cols'] = [
    { wch: 8 },   // BA
    { wch: 22 },  // BA CABANG
    { wch: 10 },  // CABANG
    { wch: 25 },  // NAMA LENGKAP
    { wch: 10 },  // NIK
    { wch: 20 },  // NO KTP
    { wch: 14 },  // TGL LAHIR
    { wch: 20 },  // NAMA IBU
    { wch: 16 },  // NO HP
    { wch: 16 },  // NO JAMSOSTEK
    { wch: 14 },  // FORM CONSENT
    { wch: 20 },  // POSISI
    { wch: 16 },  // TRAINEE SEJAK
  ]

  // Freeze first 3 rows (legend + header + sub-header)
  ws['!freeze'] = { xSplit: 0, ySplit: 3 }

  // Data validation for dropdown columns (rows 3-1002)
  const validations: Array<{
    type: string; sqref: string; formulas: string[];
    showErrorMessage: boolean; errorTitle: string; error: string;
  }> = [
    // CABANG (column C = index 2)
    {
      type: 'list',
      sqref: 'C4:C1002',
      formulas: ['H720,H721,H722,H723,H724,H725,H726,H727,H728,H729,H730'],
      showErrorMessage: true,
      errorTitle: 'Cabang Tidak Valid',
      error: 'Pilih kode cabang yang tersedia: H720-H730',
    },
    // FORM CONSENT (column K = index 10)
    {
      type: 'list',
      sqref: 'K4:K1002',
      formulas: ['ADA,TIDAK ADA'],
      showErrorMessage: true,
      errorTitle: 'Form Consent Tidak Valid',
      error: 'Pilih: ADA atau TIDAK ADA',
    },
    // POSISI (column L = index 11)
    {
      type: 'list',
      sqref: 'L4:L1002',
      formulas: ['SALES EXECUTIVE,SALESGIRL,COUNTER SALES,MECHANIC,TEAM LEADER,ADMINISTRATOR'],
      showErrorMessage: true,
      errorTitle: 'Posisi Tidak Valid',
      error: 'Pilih posisi yang tersedia dari dropdown',
    },
  ]
  ws['!dataValidations'] = { list: validations }

  XLSX.utils.book_append_sheet(wb, ws, 'Data Karyawan')

  // ═══════════════════════════════════════════════════════════════════════
  // SHEET 2: Petunjuk Pengisian
  // ═══════════════════════════════════════════════════════════════════════
  const guideData = [
    ['PETUNJUK PENGISIAN TEMPLATE IMPORT KARYAWAN'],
    ['Trainee Monitoring System — Astra Motor Kalimantan Barat'],
    [''],
    ['ATURAN UMUM'],
    ['1. Isi data mulai dari baris ke-4 (baris 1 = legenda, baris 2 = header, baris 3 = keterangan format)'],
    ['2. JANGAN mengubah nama kolom di baris 2'],
    ['3. Kolom bertanda ★ wajib diisi, kolom bertanda ○ opsional'],
    ['4. Maksimal 1000 baris per import'],
    ['5. No KTP yang sudah terdaftar akan otomatis dilewati (tidak duplikat)'],
    [''],
    ['KOLOM', 'WAJIB', 'FORMAT', 'KETERANGAN'],
    ['BA', 'Ya', 'Teks (maks 20 karakter)', 'Kode Business Area, contoh: H720'],
    ['BA CABANG', 'Ya', 'Teks (maks 100 karakter)', 'Nama lengkap cabang, contoh: REGION PONTIANAK'],
    ['CABANG', 'Ya', 'Kode cabang (dropdown)', 'H720, H721, H722, H723, H724, H725, H726, H727, H728, H729, H730'],
    ['NAMA LENGKAP', 'Ya', 'Teks (2-100 karakter)', 'Nama lengkap karyawan sesuai KTP'],
    ['NIK', 'Tidak', 'Teks (maks 20 karakter)', 'Nomor Induk Karyawan internal, boleh kosong'],
    ['NO KTP', 'Ya', 'Angka (tepat 16 digit)', 'Nomor KTP / NIK nasional, harus unik'],
    ['TGL LAHIR', 'Ya', 'dd.MM.yyyy', 'Tanggal lahir. Contoh: 15.03.1998 atau 15/03/1998'],
    ['NAMA IBU', 'Ya', 'Teks (2-100 karakter)', 'Nama ibu kandung'],
    ['NO HP', 'Ya', 'Angka (08xxx, 10-15 digit)', 'Nomor HP aktif, harus diawali 08'],
    ['NO JAMSOSTEK', 'Tidak', 'Teks (maks 30 karakter)', 'Nomor BPJS Ketenagakerjaan, boleh kosong'],
    ['FORM CONSENT', 'Ya', 'ADA / TIDAK ADA', 'Status form consent karyawan'],
    ['POSISI', 'Ya', 'Pilih dari dropdown', 'SALES EXECUTIVE, SALESGIRL, COUNTER SALES, MECHANIC, TEAM LEADER, ADMINISTRATOR'],
    ['TRAINEE SEJAK', 'Ya', 'dd.MM.yyyy', 'Tanggal mulai kontrak. Selesai kontrak dihitung otomatis oleh sistem.'],
    [''],
    ['KODE CABANG'],
    ['Kode', 'Nama Cabang'],
    ['H720', 'REGION PONTIANAK'],
    ['H721', 'KETAPANG'],
    ['H722', 'PATTIMURA'],
    ['H723', 'SINGKAWANG'],
    ['H724', 'SANGGAU'],
    ['H725', 'IMAM BONJOL'],
    ['H726', 'NDS.AYANI'],
    ['H727', 'BENUA KAYONG'],
    ['H728', 'SINTANG'],
    ['H729', 'PUTUSSIBAU'],
    ['H730', 'SAMBAS'],
    [''],
    ['PERHITUNGAN KONTRAK OTOMATIS'],
    ['Posisi', 'Durasi Kontrak'],
    ['ADMINISTRATOR', '3 bulan dari Trainee Sejak'],
    ['Posisi lainnya', '6 bulan dari Trainee Sejak'],
  ]

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  wsGuide['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 28 },
    { wch: 65 },
  ]

  // Merge title row
  wsGuide['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ]

  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk')

  XLSX.writeFile(wb, 'Template_Import_Karyawan_TMS.xlsx')
}

export function ImportExcelButton() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState<{ created: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setDone(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]

      // Read all rows as raw arrays to find the actual header row
      const rawRows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

      // Find header row: the row containing REQUIRED_COLS keys (with or without ★/○ prefix)
      let headerIdx = -1
      for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
        const rowKeys = rawRows[i].map((c: string) =>
          String(c).replace(/^[★○]\s*/, '').toUpperCase().trim()
        )
        // If this row contains at least 3 required columns, it's the header
        const matches = REQUIRED_COLS.filter(col => rowKeys.includes(col))
        if (matches.length >= 3) {
          headerIdx = i
          break
        }
      }

      if (headerIdx === -1) {
        // Fallback: use first row as header
        headerIdx = 0
      }

      // Build header keys from the detected header row
      const headerKeys = rawRows[headerIdx].map((c: string) =>
        String(c).replace(/^[★○]\s*/, '').toUpperCase().trim()
      )

      // Skip legend, header, and sub-header rows — find where data actually starts
      // Data starts after header + 1 (sub-header row, if it looks like format hints)
      let dataStart = headerIdx + 1
      if (dataStart < rawRows.length) {
        const nextRow = rawRows[dataStart].map((c: string) => String(c).toLowerCase().trim())
        const looksLikeSubHeader = nextRow.some(v =>
          v.includes('wajib') || v.includes('opsional') || v.includes('dropdown') ||
          v.includes('maks') || v.includes('min ') || v.includes('dd.mm')
        )
        if (looksLikeSubHeader) dataStart++
      }

      // Map remaining rows to objects using header keys
      const dataRows = rawRows.slice(dataStart)
      const normalized = dataRows
        .filter(row => row.some((c: string) => String(c).trim() !== ''))  // skip blank rows
        .map(row => {
          const out: Record<string, string> = {}
          headerKeys.forEach((key, idx) => {
            if (key) out[key] = String(row[idx] ?? '').trim()
          })
          return out
        })

      const preview: PreviewRow[] = normalized.map((raw, i) => {
        // Quick client-side check for missing required columns
        const missing = REQUIRED_COLS.filter(col => !raw[col] || raw[col] === '-')
        if (missing.length > 0) {
          return { index: i, raw, status: 'error', error: `Kolom kosong: ${missing.slice(0, 3).join(', ')}` }
        }
        return { index: i, raw, status: 'pending' }
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

      setDone({ created: result.created, skipped: result.skipped })

      if (result.created > 0) {
        toast.success(`${result.created} karyawan berhasil diimport`)
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
    setOpen(false)
  }

  const displayCols = ['NAMA LENGKAP', 'NO KTP', 'CABANG', 'POSISI', 'TRAINEE SEJAK']

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
                  <p className="text-[11px] text-muted-foreground">Upload data karyawan (.xlsx)</p>
                </div>
              </button>
              <div className="mx-3 my-1 border-t border-border/60" />
              <button
                onClick={() => { downloadTemplate(); setMenuOpen(false) }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors text-left"
              >
                <Download size={16} className="text-green-600 shrink-0" />
                <div>
                  <p className="font-semibold">Download Template</p>
                  <p className="text-[11px] text-muted-foreground">File contoh format import</p>
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
              {fileName && <span className="font-medium">{fileName}</span>} — {rows.length} baris terdeteksi
            </DialogDescription>
          </DialogHeader>

          {/* Summary bar */}
          <div className="flex items-center gap-4 px-6 py-2 bg-muted/50 border-b border-border/60 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-green-700">
              <CheckCircle size={12} /> {validRows.length} siap import
            </span>
            <span className="flex items-center gap-1.5 text-red-600">
              <WarningCircle size={12} /> {errorRows.length} error
            </span>
            {done && (
              <span className="ml-auto flex items-center gap-1.5 text-primary">
                <CheckCircle size={12} /> Selesai: {done.created} dibuat, {done.skipped} dilewati
              </span>
            )}
            <button
              onClick={downloadTemplate}
              className="ml-auto flex items-center gap-1 text-muted-foreground/70 hover:text-foreground/80 transition-colors font-medium"
            >
              <Download size={12} /> Download Template
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white w-10">#</th>
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white w-20">Status</th>
                  {displayCols.map(c => (
                    <th key={c} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-white">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
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
                      <td key={c} className="px-3 py-2 text-foreground/80 whitespace-nowrap max-w-[160px] truncate">
                        {row.raw[c] || <span className="text-muted-foreground/50">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-red-600 text-[11px]">{row.error || ''}</td>
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
                    : <><Upload size={12} /> Import {validRows.length} Karyawan</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
