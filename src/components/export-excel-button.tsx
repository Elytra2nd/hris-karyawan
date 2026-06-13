'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { MicrosoftExcelLogoIcon, CircleNotch, Download, FileText, Sliders, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getAllEmployeesForExport } from '@/app/actions/employee'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Row = Record<string, string>

/**
 * Safely format a date-like value. The `tglLahir` field is stored as a plain
 * string in the DB (e.g. "2000-01-15" or "15.01.2000"), NOT a Date object.
 * Contract dates *are* real Date objects from Prisma.
 */
function safeDateFormat(value: unknown, fmt = 'dd.MM.yyyy'): string {
  if (!value) return '-'
  try {
    const d = value instanceof Date ? value : new Date(String(value))
    if (isNaN(d.getTime())) return String(value) // fallback — return raw
    return format(d, fmt)
  } catch {
    return String(value)
  }
}

function toRows(rawData: Awaited<ReturnType<typeof getAllEmployeesForExport>>): Row[] {
  return rawData.map((emp) => ({
    'BA': emp.ba,
    'BA CABANG': emp.baCabang,
    'REGION': emp.region ?? '-',
    'CABANG': emp.cabang,
    'DEPARTEMEN': emp.department?.name ?? '-',
    'KODE DEPT': emp.department?.code ?? '-',
    'Nama Lengkap': emp.namaLengkap,
    'Status': emp.status,
    'NIK': emp.nik ?? '-',
    'No Jamsostek': emp.noJamsostek ?? '-',
    'No KTP': emp.noKtp,
    'Tgl Lahir': safeDateFormat(emp.tglLahir),
    'Nama Ibu': emp.namaIbu,
    'Trainee Sejak': emp.contracts[0] ? safeDateFormat(emp.contracts[0].traineeSejak) : '-',
    'Trainee Selesai': emp.contracts[0] ? safeDateFormat(emp.contracts[0].traineeSelesai) : '-',
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
      if (raw.length === 0) {
        toast.info('Tidak ada data karyawan untuk di-export')
        return
      }
      setAllRows(toRows(raw))
      setFilterCabang('')
      setFilterStatus('')
      setFilterPosisi('')
      setOpen(true)
    } catch {
      toast.error('Gagal mengambil data karyawan')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setFilterCabang(''); setFilterStatus(''); setFilterPosisi('') }

  const downloadExcel = () => {
    if (filtered.length === 0) {
      toast.warning('Tidak ada data untuk di-export')
      return
    }
    const ws = XLSX.utils.json_to_sheet(filtered)

    // Auto-fit column widths
    const colWidths = Object.keys(filtered[0]).map(key => {
      const maxLen = Math.max(
        key.length,
        ...filtered.map(r => (r[key] ?? '').length)
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })
    ws['!cols'] = colWidths

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    const fileName = `HRIS_Astra_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`
    XLSX.writeFile(wb, fileName)
    toast.success(`File ${fileName} berhasil diunduh`)
    setOpen(false)
  }

  const downloadPDF = () => {
    if (filtered.length === 0) {
      toast.warning('Tidak ada data untuk di-export')
      return
    }

    // Kolom yang paling penting untuk PDF (tidak semua, karena lebar terbatas)
    const pdfCols = ['BA', 'CABANG', 'Nama Lengkap', 'Status', 'NIK', 'No KTP', 'Posisi', 'Trainee Sejak', 'Trainee Selesai', 'No HP']

    const html = `<html><head><title>HRIS Report</title><style>
      @page{size:landscape;margin:10mm}
      body{font-family:Arial,sans-serif;font-size:9px;margin:12px}
      h2{font-size:14px;margin-bottom:4px}p.meta{color:#666;font-size:10px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      th{background:#1e293b;color:#fff;padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase}
      td{padding:4px 6px;border-bottom:1px solid #eee;font-size:9px}
      tr:nth-child(even){background:#f9f9f9}
      .footer{margin-top:16px;font-size:8px;color:#999;text-align:right}
    </style></head><body>
    <h2>Laporan Data Karyawan — Astra Motor Kalimantan Barat</h2>
    <p class="meta">Tanggal: ${format(new Date(), 'dd MMMM yyyy, HH:mm')} | Total: ${filtered.length} data${filterCabang ? ` | Cabang: ${filterCabang}` : ''}${filterStatus ? ` | Status: ${filterStatus}` : ''}${filterPosisi ? ` | Posisi: ${filterPosisi}` : ''}</p>
    <table><thead><tr>${pdfCols.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${filtered.map(row => '<tr>' + pdfCols.map(h => `<td>${row[h] ?? '-'}</td>`).join('') + '</tr>').join('')}
    </tbody></table>
    <p class="footer">Dicetak oleh sistem TMS v2.1 — ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
    </body></html>`

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.print()
    } else {
      toast.error('Pop-up diblokir browser. Izinkan pop-up untuk mencetak PDF.')
    }
    setOpen(false)
  }

  const cabangOpts = [...new Set(allRows.map(r => r['CABANG']))].sort()
  const statusOpts = [...new Set(allRows.map(r => r['Status']))].sort()
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
              Filter data sebelum download. {allRows.length} total karyawan tersedia.
            </DialogDescription>
          </DialogHeader>

          {/* Funnel row */}
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border/60 bg-muted/50 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Sliders size={13} /> Filter:
            </div>

            <select value={filterCabang} onChange={e => setFilterCabang(e.target.value)} className={selectCls}>
              <option value="">Semua Cabang</option>
              {cabangOpts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Semua Status</option>
              {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
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
                {filtered.slice(0, 200).map((row, i) => (
                  <tr key={i} className={cn('border-b border-border/60', i % 2 === 0 ? 'bg-card' : 'bg-muted/80')}>
                    {headers.map(h => (
                      <td key={h} className="px-2 py-1 whitespace-nowrap text-foreground/70">{row[h]}</td>
                    ))}
                  </tr>
                ))}
                {filtered.length > 200 && (
                  <tr>
                    <td colSpan={headers.length} className="py-3 text-center text-xs font-semibold text-muted-foreground bg-accent/50">
                      … dan {filtered.length - 200} baris lainnya (preview dibatasi 200 baris)
                    </td>
                  </tr>
                )}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 border-t border-border/60 bg-card">
            <span className="text-xs font-semibold text-muted-foreground/70">
              {filtered.length} data siap di-export
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Tutup</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                disabled={filtered.length === 0}
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                <FileText size={13} /> Cetak PDF
              </Button>
              <Button
                size="sm"
                onClick={downloadExcel}
                disabled={filtered.length === 0}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                <MicrosoftExcelLogoIcon size={13} /> Excel (.xlsx)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
