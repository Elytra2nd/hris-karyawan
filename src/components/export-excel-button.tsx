'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Loader2, Download, FileText, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getAllEmployeesForExport } from '@/app/actions/employee';
import { format } from 'date-fns';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export function ExportExcelButton({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  const [loading, setLoading] = useState(false);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filterCabang, setFilterCabang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPosisi, setFilterPosisi] = useState('');

  const prepareData = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const rawData = await getAllEmployeesForExport();
      const transformed = rawData.map((emp) => ({
        'BA': emp.ba,
        'BA CABANG': emp.baCabang,
        'REGION': emp.region,
        'CABANG': emp.cabang,
        'Nama Lengkap': emp.namaLengkap,
        'Status': emp.status,
        'NIK': emp.nik || '-',
        'No Jamsostek': emp.noJamsostek || '-',
        'No KTP': emp.noKtp,
        'Tgl Lahir': emp.tglLahir ? format(new Date(emp.tglLahir), 'dd.MM.yyyy') : '-',
        'Nama Ibu': emp.namaIbu,
        'Trainee Sejak': emp.contracts[0] ? format(new Date(emp.contracts[0].traineeSejak), 'dd.MM.yyyy') : '-',
        'Trainee Selesai': emp.contracts[0] ? format(new Date(emp.contracts[0].traineeSelesai), 'dd.MM.yyyy') : '-',
        'Posisi': emp.contracts[0]?.posisi || '-',
        'No HP': emp.noHp || '-',
        'Form Consent': emp.formConsent || '-',
      }));
      setDataPreview(transformed);
      setFilteredData(transformed);
      setFilterCabang('');
      setFilterStatus('');
      setFilterPosisi('');
      setIsOpen(true);
    } catch {
      alert("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (cab: string, stat: string, pos: string) => {
    let d = [...dataPreview];
    if (cab) d = d.filter(r => r['CABANG'] === cab);
    if (stat) d = d.filter(r => r['Status'] === stat);
    if (pos) d = d.filter(r => r['Posisi'] === pos);
    setFilteredData(d);
  };

  const handleFilterChange = (type: 'cabang' | 'status' | 'posisi', val: string) => {
    const c = type === 'cabang' ? val : filterCabang;
    const s = type === 'status' ? val : filterStatus;
    const p = type === 'posisi' ? val : filterPosisi;
    if (type === 'cabang') setFilterCabang(val);
    if (type === 'status') setFilterStatus(val);
    if (type === 'posisi') setFilterPosisi(val);
    applyFilter(c, s, p);
  };

  const resetFilters = () => { setFilterCabang(''); setFilterStatus(''); setFilterPosisi(''); setFilteredData(dataPreview); };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `HRIS_Astra_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    setIsOpen(false);
  };

  const downloadPDF = () => {
    // Create printable HTML table for PDF
    const headers = filteredData.length > 0 ? Object.keys(filteredData[0]) : [];
    let html = `<html><head><title>HRIS Report</title><style>
      body{font-family:Arial,sans-serif;font-size:9px;margin:12px;}
      h2{font-size:14px;margin-bottom:4px;}
      p{color:#666;font-size:10px;margin-bottom:12px;}
      table{width:100%;border-collapse:collapse;}
      th{background:#1E293B;color:#fff;padding:4px 6px;text-align:left;font-size:8px;text-transform:uppercase;}
      td{padding:4px 6px;border-bottom:1px solid #eee;font-size:9px;}
      tr:nth-child(even){background:#f9f9f9;}
    </style></head><body>
    <h2>Laporan Data Karyawan — Astra Motor Kalimantan Barat</h2>
    <p>Tanggal: ${format(new Date(), 'dd MMMM yyyy')} | Total: ${filteredData.length} data</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    filteredData.forEach(row => {
      html += '<tr>' + headers.map(h => `<td>${row[h]}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table></body></html>';
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
    setIsOpen(false);
  };

  const cabangOptions = [...new Set(dataPreview.map(r => r['CABANG']))].sort();
  const posisiOptions = [...new Set(dataPreview.map(r => r['Posisi']).filter(p => p !== '-'))].sort();

  return (
    <>
      {variant === 'sidebar' ? (
        <button onClick={prepareData} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500, color: '#64748B', backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
        >
          {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#94A3B8' }} /> : <FileSpreadsheet size={18} style={{ color: '#94A3B8' }} />}
          <span>Export Data</span>
        </button>
      ) : (
        <button onClick={prepareData} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 16px', fontSize: 14, fontWeight: 600, color: '#1E293B', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={16} />}
          Export
        </button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ fontFamily: F }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>
              Export Data Karyawan
            </DialogTitle>
          </DialogHeader>

          {/* FILTER ROW */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748B' }}>
              <SlidersHorizontal size={14} /> Filter:
            </div>
            <select value={filterCabang} onChange={e => handleFilterChange('cabang', e.target.value)} style={selS}>
              <option value="">Semua Cabang</option>
              {cabangOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={e => handleFilterChange('status', e.target.value)} style={selS}>
              <option value="">Semua Status</option>
              <option value="AKTIF">AKTIF</option>
              <option value="NON-AKTIF">NON-AKTIF</option>
            </select>
            <select value={filterPosisi} onChange={e => handleFilterChange('posisi', e.target.value)} style={selS}>
              <option value="">Semua Posisi</option>
              {posisiOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={resetFilters} style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#64748B' }}>{filteredData.length} dari {dataPreview.length} data</span>
          </div>

          {/* TABLE PREVIEW */}
          <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 mt-2">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#1E293B' }}>
                  {filteredData.length > 0 && Object.keys(filteredData[0]).map(key => (
                    <th key={key} style={{ padding: '6px 8px', color: '#fff', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'left', borderRight: '1px solid #334155' }}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} style={{ padding: '4px 8px', whiteSpace: 'nowrap', borderBottom: '1px solid #F1F5F9', fontSize: 10, color: '#475569' }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER WITH ACTIONS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
              {filteredData.length} data siap di-export
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" onClick={() => setIsOpen(false)} style={{ fontFamily: F }}>Tutup</Button>
              <Button onClick={downloadPDF} variant="outline" className="gap-2" style={{ fontFamily: F, color: '#DC2626', borderColor: '#FECACA' }}>
                <FileText size={14} /> PDF
              </Button>
              <Button onClick={downloadExcel} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" style={{ fontFamily: F }}>
                <FileSpreadsheet size={14} /> Excel (.xlsx)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const selS: React.CSSProperties = {
  height: 32, padding: '0 24px 0 8px', fontSize: 12, border: '1px solid #E2E8F0',
  borderRadius: 6, background: '#fff', color: '#475569', cursor: 'pointer', outline: 'none',
  fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center',
};