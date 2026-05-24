'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Upload, MicrosoftExcelLogoIcon, WarningCircle, CheckCircle,
  CircleNotch, Download, X, WarningIcon,
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

const REQUIRED_COLS = ['BA', 'BA CABANG', 'REGION', 'CABANG', 'NAMA LENGKAP', 'NO KTP', 'TGL LAHIR', 'NAMA IBU', 'NO HP', 'FORM CONSENT', 'POSISI', 'TRAINEE SEJAK']

function downloadTemplate() {
  const headers = ['BA', 'BA CABANG', 'REGION', 'CABANG', 'NAMA LENGKAP', 'NIK', 'NO KTP', 'TGL LAHIR', 'NAMA IBU', 'NO HP', 'NO JAMSOSTEK', 'FORM CONSENT', 'POSISI', 'TRAINEE SEJAK']
  const example = ['BA001', 'PT. Astra Motor Pontianak', 'PONTIANAK', 'PONTIANAK', 'Budi Santoso', '1234', '3271234567890001', '01.01.2000', 'Siti Aminah', '081234567890', '', 'ADA', 'SALESMAN', '01.07.2024']
  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, 'Template_Import_Karyawan.xlsx')
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
      const parsed: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

      // Normalize header keys to uppercase
      const normalized = parsed.map(row => {
        const out: Record<string, string> = {}
        for (const [k, v] of Object.entries(row)) {
          out[k.toUpperCase().trim()] = String(v).trim()
        }
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

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />

      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Upload size={15} />
        Import Excel
      </button>

      <Dialog open={open} onOpenChange={v => { if (!v) reset() }}>
        <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-slate-100">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MicrosoftExcelLogoIcon size={18} className="text-primary" />
              Import Data Karyawan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">
              {fileName && <span className="font-medium">{fileName}</span>} — {rows.length} baris terdeteksi
            </DialogDescription>
          </DialogHeader>

          {/* Summary bar */}
          <div className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-green-700">
              <CheckCircle size={13} /> {validRows.length} siap import
            </span>
            <span className="flex items-center gap-1.5 text-red-600">
              <WarningCircle size={13} /> {errorRows.length} error
            </span>
            {done && (
              <span className="ml-auto flex items-center gap-1.5 text-primary">
                <CheckCircle size={13} /> Selesai: {done.created} dibuat, {done.skipped} dilewati
              </span>
            )}
            <button
              onClick={downloadTemplate}
              className="ml-auto flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors font-medium"
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
                      'border-b border-slate-100',
                      row.status === 'error' ? 'bg-red-50' : row.status === 'ok' ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    )}
                  >
                    <td className="px-3 py-2 text-slate-400 font-mono">{row.index + 1}</td>
                    <td className="px-3 py-2">
                      {row.status === 'error' && <span className="inline-flex items-center gap-1 text-red-600 font-bold"><WarningCircle size={11} /> Error</span>}
                      {row.status === 'ok' && <span className="inline-flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={11} /> OK</span>}
                      {row.status === 'pending' && <span className="text-slate-400">Siap</span>}
                    </td>
                    {displayCols.map(c => (
                      <td key={c} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[160px] truncate">
                        {row.raw[c] || <span className="text-slate-300">—</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-red-600 text-[11px]">{row.error || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white">
            {errorRows.length > 0 && !done && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                <WarningIcon size={12} />
                {errorRows.length} baris bermasalah akan dilewati
              </div>
            )}
            {done && (
              <div className="text-xs text-slate-500">Import selesai.</div>
            )}
            {!errorRows.length && !done && <div />}

            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={reset}>
                <X size={13} className="mr-1" /> Tutup
              </Button>
              {!done && (
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="gap-1.5"
                >
                  {importing
                    ? <><CircleNotch size={13} className="animate-spin" /> Mengimport...</>
                    : <><Upload size={13} /> Import {validRows.length} Karyawan</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
