'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { id as localeID } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeeTableProps {
  data: any[];
  currentPage: number;
  totalPages: number;
}

export default function EmployeeTable({ data, currentPage, totalPages }: EmployeeTableProps) {
  const router = useRouter();

  const goToPage = (page: number) => {
    // Navigasi ke URL dengan query parameter page baru
    router.push(`?page=${page}`);
  };

  return (
    <div className="flex flex-col">
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-bold text-slate-700">NIK</TableHead>
              <TableHead className="font-bold text-slate-700">Nama Karyawan</TableHead>
              <TableHead className="font-bold text-slate-700">Cabang</TableHead>
              <TableHead className="font-bold text-slate-700">Posisi</TableHead>
              <TableHead className="font-bold text-slate-700">Akhir Kontrak</TableHead>
              <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
              <TableHead className="font-bold text-slate-700 text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-slate-500">
                  Belum ada data karyawan. Silakan tambah data baru.
                </TableCell>
              </TableRow>
            ) : (
              data.map((emp) => {
                const latestContract = emp.contracts[0];
                
                return (
                  <TableRow key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">{emp.nik || '-'}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{emp.namaLengkap}</TableCell>
                    <TableCell>{emp.cabang}</TableCell>
                    <TableCell>{latestContract?.posisi || '-'}</TableCell>
                    <TableCell>
                      {latestContract 
                        ? format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID }) 
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={emp.status === 'AKTIF' ? 'default' : 'destructive'}
                        className={emp.status === 'AKTIF' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2 pr-6">
                      <Link href={`/karyawan/${emp.id}`}>
                        <Button variant="outline" size="sm" className="h-8">Detail</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER PAGINASI */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t bg-white">
          <p className="text-xs text-slate-500 font-medium">
            Menampilkan halaman <span className="text-slate-900 font-bold">{currentPage}</span> dari <span className="font-bold text-slate-900">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 gap-1 px-3"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 gap-1 px-3"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}