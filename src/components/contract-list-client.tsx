'use client';

import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee, ContractListItem } from '@/types';

const PDFButton = dynamic(() => import('@/components/pdf-button'), {
  ssr: false,
  loading: () => <span className="text-xs animate-pulse">Loading...</span>
});

export function ContractListClient({ employee, contracts }: { employee: Employee; contracts: ContractListItem[] }) {
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
            <thead className="bg-muted/50 border-b border-border/60">
              <tr>
                <th className="px-6 py-2 font-bold text-foreground/80 uppercase text-xs tracking-tighter italic">Jabatan</th>
                <th className="px-6 py-2 font-bold text-foreground/80 uppercase text-xs tracking-tighter italic text-center">Aksi</th>
                <th className="px-6 py-2 font-bold text-foreground/80 uppercase text-xs tracking-tighter italic">Mulai</th>
                <th className="px-6 py-2 font-bold text-foreground/80 uppercase text-xs tracking-tighter italic">Selesai</th>
                <th className="px-6 py-2 font-bold text-foreground/80 uppercase text-xs tracking-tighter text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract, index) => {
                const isExpired = new Date(contract.traineeSelesai) < new Date();
                return (
                  <tr key={contract.id} className="border-b border-border/40 hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-black text-foreground uppercase text-[12px]">{contract.posisi}</td>
                    <td className="px-6 py-4 text-center">
                      {/* Komponen Client yang me-render PDF */}
                      <PDFButton employee={employee} contract={contract} />
                    </td>
                    <td className="px-6 py-4 text-foreground/70 font-medium">{format(new Date(contract.traineeSejak), 'dd MMM yyyy', { locale: localeID })}</td>
                    <td className="px-6 py-4 text-foreground/70 font-medium">{format(new Date(contract.traineeSelesai), 'dd MMM yyyy', { locale: localeID })}</td>
                    <td className="px-6 py-4 text-center">
                      {index === 0 && !isExpired ? (
                        <Badge className="bg-emerald-500 uppercase text-xs font-black">Running</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground/70 uppercase text-xs font-bold">Closed</Badge>
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