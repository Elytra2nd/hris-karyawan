'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { MicrosoftExcelLogoIcon, CircleNotch, Download, FileText, Sliders, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getAllEmployeesForExport } from '@/app/actions/employee'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Row = Record<string, string>

function toRows(rawData: Awaited<ReturnType<typeof getAllEmployeesForExport>>): Row[] {
  return rawData.map((emp) => ({
    'BA': emp.ba,
    'BA CABANG': emp.baCabang,
    'CABANG': emp.cabang,
    'Nama Lengkap': emp.namaLengkap,
    'Status': emp.status,
    'NIK': emp.nik ?? '-',
    'No Jamsostek': emp.noJamsostek ?? '-',
    'No KTP': emp.noKtp,
    'Tgl Lahir': emp.tglLahir ? format(new Date(emp.tglLahir), 'dd.MM.yyyy') : '-',
    'Nama Ibu': emp.namaIbu,
    'Trainee Sejak': emp.contracts[0] ? format(new Date(emp.contracts[0].traineeSejak), 'dd.MM.yyyy') : '-',
    'Trainee Selesai': emp.contracts[0] ? format(new Date(emp.contracts[0].traineeSelesai), 'dd.MM.yyyy') : '-',
    'Posisi': emp.contracts[0]?.posisi ?? '-',
    'No HP': emp.noHp ?? '-',
    'Form Consent': emp.formConsent ?? '-',
  }))
}

function applyFilters(rows: Row[], cabang: string, status: string, posisi: string): Row[] {
  return rows.filter(r =>
    (!cabang || r['CABANG'] === cabang) &&
    (!status || r['Status'] === status) &&
    (!posisi || r['Posisi'] === posisi)
  )
}

export function ExportExcelButton({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  const [loading, setLoading] = useState(false)
  const [allRows, setAllRows] = useState<Row[]>([])
  const [open, setOpen] = useState(false)
  const [filterCabang, setFilterCabang] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPosisi, setFilterPosisi] = useState('')

  const filtered = applyFilters(allRows, filterCabang, filterStatus, filterPosisi)

  const load = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const raw = await getAllEmployeesForExport()
      setAllRows(toRows(raw))
      setFilterCabang('')
      setFilterStatus('')
      setFilterPosisi('')
      setOpen(true)
    } catch {
      alert('Gagal mengambil data.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setFilterCabang(''); setFilterStatus(''); setFilterPosisi('') }

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `HRIS_Astra_${format(new Date(), 'yyyyMMdd')}.xlsx`)
    setOpen(false)
  }

  const downloadPDF = () => {
    const headers = filtered.length > 0 ? Object.keys(filtered[0]) : []
    const html = `<html><head><title>HRIS Report</title><style>
      body{font-family:Arial,sans-serif;font-size:9px;margin:12px}
      h2{font-size:14px;margin-bottom:4px}p{color:#666;font-size:10px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      th{background:#1e293b;color:#fff;padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase}
      td{padding:4px 6px;border-bottom:1px solid #eee;font-size:9px}
      tr:nth-child(even){background:#f9f9f9}
    </style></head><body>
    <h2>Laporan Data Karyawan — Astra Motor Kalimantan Barat</h2>
    <p>Tanggal: ${format(new Date(), 'dd MMMM yyyy')} | Total: ${filtered.length} data</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${filtered.map(row => '<tr>' + headers.map(h => `<td>${row[h]}</td>`).join('') + '</tr>').join('')}
    </tbody></table></body></html>`
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
    setOpen(false)
  }

  const cabangOpts = [...new Set(allRows.map(r => r['CABANG']))].sort()
  const posisiOpts = [...new Set(allRows.map(r => r['Posisi']).filter(p => p !== '-'))].sort()
  const headers = filtered.length > 0 ? Object.keys(filtered[0]) : []

  const selectCls = "h-8 pl-2 pr-7 text-xs border border-border rounded-md bg-card text-foreground/70 outline-none focus:ring-1 focus:ring-primary/40 appearance-none cursor-pointer"

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-60"
        >
          {loading
            ? <CircleNotch size={16} className="animate-spin text-muted-foreground/70" />
            : <MicrosoftExcelLogoIcon size={16} className="text-muted-foreground/70" />}
          Export Data
        </button>
      ) : (
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-foreground/80 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-60"
        >
          {loading ? <CircleNotch size={15} className="animate-spin" /> : <Download size={15} />}
          Export
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60">
            <DialogTitle className="text-lg font-bold text-foreground">Export Data Karyawan</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Funnel data sebelum download. {allRows.length} total karyawan tersedia.
            </DialogDescription>
          </DialogHeader>

          {/* Funnel row */}
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/60 bg-muted/50 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Sliders size={13} /> Funnel:
            </div>

            <select value={filterCabang} onChange={e => setFilterCabang(e.target.value)} className={selectCls}>
              <option value="">Semua Cabang</option>
              {cabangOpts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Semua Status</option>
              <option value="AKTIF">AKTIF</option>
              <option value="NON-AKTIF">NON-AKTIF</option>
            </select>

            <select value={filterPosisi} onChange={e => setFilterPosisi(e.target.value)} className={selectCls}>
              <option value="">Semua Posisi</option>
              {posisiOpts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {(filterCabang || filterStatus || filterPosisi) && (
              <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground/70 hover:text-foreground/80 transition-colors">
                <X size={12} /> Reset
              </button>
            )}

            <span className="ml-auto text-xs font-semibold text-muted-foreground">
              {filtered.length} / {allRows.length} data
            </span>
          </div>

          {/* Table preview */}
          <div className="flex-1 overflow-auto bg-muted/50 mx-0">
            <table className="w-full border-collapse text-[10px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800">
                  {headers.map(h => (
                    <th key={h} className="px-2 py-1.5 text-left text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap border-r border-slate-700 last:border-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i} className={cn('border-b border-border/60', i % 2 === 0 ? 'bg-card' : 'bg-muted/80')}>
                    {headers.map(h => (
                      <td key={h} className="px-2 py-1 whitespace-nowrap text-foreground/70">{row[h]}</td>
                    ))}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} className="py-12 text-center text-xs font-bold text-muted-foreground/70 uppercase tracking-wider">
                      Tidak ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/60 bg-card">
            <span className="text-xs font-semibold text-muted-foreground/70">
              {filtered.length} data siap di-export
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Tutup</Button>
              <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                <FileText size={13} /> PDF
              </Button>
              <Button size="sm" onClick={downloadExcel} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                <MicrosoftExcelLogoIcon size={13} /> Excel (.xlsx)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
