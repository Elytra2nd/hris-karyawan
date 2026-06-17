'use client'

import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  MicrosoftExcelLogoIcon,
  CircleNotch,
  Download,
  FileText,
  Funnel,
  X,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { getAllEmployeesForExport } from '@/app/actions/employee'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Row = Record<string, string>

function safeDateFormat(value: unknown, fmt = 'dd.MM.yyyy'): string {
  if (!value) return '-'
  try {
    const d = value instanceof Date ? value : new Date(String(value))
    if (isNaN(d.getTime())) return String(value)
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

function applyFilters(rows: Row[], cabang: string, status: string, posisi: string, search: string): Row[] {
  return rows.filter(r => {
    const matchCabang = !cabang || r['CABANG'] === cabang
    const matchStatus = !status || r['Status'] === status
    const matchPosisi = !posisi || r['Posisi'] === posisi
    const matchSearch = !search || r['Nama Lengkap'].toLowerCase().includes(search.toLowerCase())
      || r['No KTP'].includes(search) || r['NIK']?.includes(search)
    return matchCabang && matchStatus && matchPosisi && matchSearch
  })
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'AKTIF'
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
      isActive
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-emerald-500' : 'bg-amber-500')} />
      {status}
    </span>
  )
}



// ─── Main Component ────────────────────────────────────────────────────────────
export function ExportExcelButton({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  const [loading, setLoading] = useState(false)
  const [allRows, setAllRows] = useState<Row[]>([])
  const [open, setOpen] = useState(false)
  const [filterCabang, setFilterCabang] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPosisi, setFilterPosisi] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () => applyFilters(allRows, filterCabang, filterStatus, filterPosisi, search),
    [allRows, filterCabang, filterStatus, filterPosisi, search]
  )



  const load = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const raw = await getAllEmployeesForExport()
      if (raw.length === 0) {
        toast.info('Belum ada data karyawan untuk diekspor')
        return
      }
      setAllRows(toRows(raw))
      setFilterCabang('')
      setFilterStatus('')
      setFilterPosisi('')
      setSearch('')
      setOpen(true)
    } catch {
      toast.error('Kami belum bisa mengambil data — coba muat ulang halaman')
    } finally {
      setLoading(false)
    }
  }

  const hasFilter = filterCabang || filterStatus || filterPosisi || search
  const reset = () => { setFilterCabang(''); setFilterStatus(''); setFilterPosisi(''); setSearch('') }

  const downloadExcel = () => {
    if (filtered.length === 0) {
      toast.warning('Tidak ada data yang cocok dengan filter — ubah filter atau reset')
      return
    }
    const ws = XLSX.utils.json_to_sheet(filtered)
    const colWidths = Object.keys(filtered[0]).map(key => {
      const maxLen = Math.max(key.length, ...filtered.map(r => (r[key] ?? '').length))
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
      toast.warning('Tidak ada data yang cocok dengan filter — ubah filter atau reset')
      return
    }
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
    if (w) { w.document.write(html); w.document.close(); w.print() }
    else { toast.error('Browser memblokir jendela cetak — izinkan pop-up lalu coba lagi') }
    setOpen(false)
  }

  const cabangOpts = [...new Set(allRows.map(r => r['CABANG']))].sort()
  const statusOpts = [...new Set(allRows.map(r => r['Status']))].sort()
  const posisiOpts = [...new Set(allRows.map(r => r['Posisi']).filter(p => p !== '-'))].sort()
  const headers = filtered.length > 0 ? Object.keys(filtered[0]) : []

  // Preview columns — hide some less important columns in preview for cleanliness
  const previewCols = ['Nama Lengkap', 'Status', 'CABANG', 'Posisi', 'NIK', 'No KTP', 'Trainee Sejak', 'Trainee Selesai', 'No HP']
  const visibleHeaders = headers.filter(h => previewCols.includes(h))

  const selectCls = "h-8 pl-2.5 pr-7 text-xs border border-border/80 rounded-lg bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 appearance-none cursor-pointer transition-all"

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-60"
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
          className="flex items-center gap-2 h-8 px-4 text-sm font-semibold text-foreground/80 bg-card border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-60"
        >
          {loading ? <CircleNotch size={16} className="animate-spin" /> : <Download size={16} />}
          Export
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] lg:max-w-6xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden rounded-2xl">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10">
                    <MicrosoftExcelLogoIcon size={20} className="text-emerald-600" />
                  </div>
                  Export Data Karyawan
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1.5 ml-10">
                  Preview dan filter data sebelum mengunduh. Semua {allRows.length} karyawan tersedia.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>



          {/* Filters */}
          <div className="flex items-center gap-2 px-6 py-2 border-b border-border/50 bg-card flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground shrink-0">
              <Funnel size={12} /> Filter:
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Cari nama / KTP…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Cari data ekspor"
                className="h-8 pl-8 pr-3 text-xs border border-border/80 rounded-lg bg-card text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all w-44"
              />
            </div>

            <select value={filterCabang} onChange={e => setFilterCabang(e.target.value)} aria-label="Filter cabang" className={selectCls}>
              <option value="">Semua Cabang</option>
              {cabangOpts.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filter status" className={selectCls}>
              <option value="">Semua Status</option>
              {statusOpts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select value={filterPosisi} onChange={e => setFilterPosisi(e.target.value)} className={selectCls}>
              <option value="">Semua Posisi</option>
              {posisiOpts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            {hasFilter && (
              <button onClick={reset} className="flex items-center gap-1 h-8 px-4 text-xs font-medium text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors">
                <X size={12} /> Reset
              </button>
            )}

            <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
              <span className="font-bold text-foreground">{filtered.length}</span> / {allRows.length}
            </span>
          </div>

          {/* Table preview */}
          <div className="flex-1 overflow-auto min-h-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center">
                  <MagnifyingGlass size={28} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-semibold">Tidak ada data ditemukan</p>
                <p className="text-xs text-muted-foreground/70">Coba ubah filter atau hapus pencarian</p>
                {hasFilter && (
                  <button onClick={reset} className="mt-1 text-xs font-medium text-primary hover:underline">Reset semua filter</button>
                )}
              </div>
            ) : (
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-800 dark:bg-slate-900">
                    <th className="px-3 py-2 text-center text-xs font-bold uppercase tracking-widest text-slate-400 w-10">
                      #
                    </th>
                    {visibleHeaders.map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((row, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'border-b border-border/40 transition-colors hover:bg-primary/5',
                        i % 2 === 0 ? 'bg-card' : 'bg-muted/40'
                      )}
                    >
                      <td className="px-3 py-1.5 text-center text-xs font-mono text-muted-foreground/50 tabular-nums">
                        {i + 1}
                      </td>
                      {visibleHeaders.map(h => (
                        <td key={h} className={cn(
                          'px-3 py-1.5 whitespace-nowrap',
                          h === 'Nama Lengkap' ? 'font-semibold text-foreground' : 'text-foreground/70',
                          h === 'No KTP' ? 'font-mono text-xs' : '',
                        )}>
                          {h === 'Status' ? <StatusBadge status={row[h]} /> : row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {filtered.length > 200 && (
                    <tr>
                      <td colSpan={visibleHeaders.length + 1} className="py-4 text-center text-xs font-medium text-muted-foreground bg-muted/50 border-t border-border/60">
                        Preview menampilkan 200 dari <span className="font-bold">{filtered.length}</span> baris. Semua data akan diunduh.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 border-t border-border/50 bg-card">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-foreground">
                {filtered.length} data siap di-export
              </span>
              {hasFilter && (
                <span className="text-xs text-muted-foreground/70">
                  Filter aktif: {[filterCabang && `Cabang: ${filterCabang}`, filterStatus && `Status: ${filterStatus}`, filterPosisi && `Posisi: ${filterPosisi}`, search && `Cari: "${search}"`].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="rounded-lg">
                Tutup
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadPDF}
                disabled={filtered.length === 0}
                className="gap-1.5 rounded-lg text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 disabled:opacity-50"
              >
                <FileText size={16} /> Cetak PDF
              </Button>
              <Button
                size="sm"
                onClick={downloadExcel}
                disabled={filtered.length === 0}
                className="gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                <MicrosoftExcelLogoIcon size={16} /> Excel (.xlsx)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
