'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, 
  Loader2, 
  Eye, 
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAllEmployeesForExport } from '@/app/actions/employee';
import { format } from 'date-fns';

export function ExportExcelButton({ variant = 'default' }: { variant?: 'default' | 'sidebar' }) {
  const [loading, setLoading] = useState(false);
  const [dataPreview, setDataPreview] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const prepareData = async (e: React.MouseEvent) => {
    // Mencegah trigger ganda jika di dalam elemen Link atau Menu
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
        'Nama Lengkap (sesuai KTP)': emp.namaLengkap,
        'Status': emp.status,
        'NIK ( HO YG ISI )': emp.nik || '-',
        'No- Jamsostek': emp.noJamsostek || '0',
        'No KTP': emp.noKtp,
        'Tgl Lahir': emp.tglLahir ? format(new Date(emp.tglLahir), 'dd.MM.yyyy') : '-',
        'Nama Ibu Kandung': emp.namaIbu,
        'Trainee Sejak': emp.contracts[0] ? format(new Date(emp.contracts[0].traineeSejak), 'dd.MM.yyyy') : '-',
        'Trainee Selesai': emp.contracts[0] ? format(new Date(emp.contracts[0].traineeSelesai), 'dd.MM.yyyy') : '-',
        'POSISI': emp.contracts[0]?.posisi || '-',
        'NO HP': emp.noHp || '-',
        'Form Consent': emp.formConsent || 'TIDAK'
      }));
      setDataPreview(transformed);
      setIsOpen(true);
    } catch (error) {
      console.error(error);
      alert("Gagal mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataPreview);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `Report_HRIS_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    setIsOpen(false);
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button 
          onClick={prepareData} 
          disabled={loading} 
          className="flex w-full items-center gap-3 py-2 px-2 text-sm font-medium rounded-md hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-slate-700 font-sans disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> : <FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
          <span>Export Excel</span>
        </button>
      ) : (
        <Button 
          variant="outline" 
          onClick={prepareData} 
          disabled={loading}
          className="h-8 w-full px-3 gap-2 text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-sans"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          Preview & Export
        </Button>
      )}

      {/* Dialog diletakkan di luar button pemicu untuk menghindari event bubbling/looping */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900 uppercase">
              <FileSpreadsheet className="text-emerald-600" /> Preview Report
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 mt-4">
            <table className="w-full text-[10px] border-collapse">
              <thead className="sticky top-0 bg-slate-800 text-white z-10">
                <tr>
                  {dataPreview.length > 0 && Object.keys(dataPreview[0]).map((key) => (
                    <th key={key} className="p-2 border border-slate-700 whitespace-nowrap text-left font-bold uppercase">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.map((row, i) => (
                  <tr key={i} className="bg-white hover:bg-blue-50 transition-colors">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="p-2 border border-slate-200 whitespace-nowrap">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between bg-slate-100 p-4 rounded-xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total: {dataPreview.length} Baris</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="font-bold">
                Tutup
              </Button>
              <Button onClick={downloadExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <Download className="h-4 w-4" /> Unduh .XLSX
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}