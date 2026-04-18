'use client';

import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Sekarang ssr: false aman digunakan di sini
const PDFButton = dynamic(() => import('@/components/pdf-button'), { 
  ssr: false,
  loading: () => <span className="text-[10px] animate-pulse">Loading...</span>
});

export function ContractListClient({ employee, contracts }: { employee: any, contracts: any[] }) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-900 text-white py-4">
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-80 text-white">
          Riwayat Perjalanan Kontrak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left font-sans">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3 font-bold text-slate-700 uppercase text-[10px] tracking-tighter italic">Jabatan</th>
                <th className="px-6 py-3 font-bold text-slate-700 uppercase text-[10px] tracking-tighter italic text-center">Aksi</th>
                <th className="px-6 py-3 font-bold text-slate-700 uppercase text-[10px] tracking-tighter italic">Mulai</th>
                <th className="px-6 py-3 font-bold text-slate-700 uppercase text-[10px] tracking-tighter italic">Selesai</th>
                <th className="px-6 py-3 font-bold text-slate-700 uppercase text-[10px] tracking-tighter text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract, index) => {
                const isExpired = new Date(contract.traineeSelesai) < new Date();
                return (
                  <tr key={contract.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-900 uppercase text-[12px]">{contract.posisi}</td>
                    <td className="px-6 py-4 text-center">
                      {/* Komponen Client yang me-render PDF */}
                      <PDFButton employee={employee} contract={contract} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{format(new Date(contract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{format(new Date(contract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}</td>
                    <td className="px-6 py-4 text-center">
                      {index === 0 && !isExpired ? (
                        <Badge className="bg-emerald-500 uppercase text-[9px] font-black">Running</Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 uppercase text-[9px] font-bold">Closed</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}