'use client';

import { useState } from 'react';
import { format, differenceInDays, differenceInMonths } from 'date-fns';
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, AlertCircle, Clock, Trash2, Loader2 } from 'lucide-react';
import { deleteEmployee } from '@/app/actions/employee';

interface EmployeeTableProps {
  data: any[];
  currentPage: number;
  totalPages: number;
}

export default function EmployeeTable({ data, currentPage, totalPages }: EmployeeTableProps) {
  const router = useRouter();
  const today = new Date();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const goToPage = (page: number) => {
    router.push(`?page=${page}`);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const result = await deleteEmployee(id);
      if (!result.success) {
        alert(result.error);
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const calculateTotalTenure = (contracts: any[]) => {
    let totalMonths = 0;
    contracts.forEach(contract => {
      const start = new Date(contract.traineeSejak);
      const end = new Date(contract.traineeSelesai);
      totalMonths += differenceInMonths(end, start);
    });
    return totalMonths;
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
              <TableHead className="font-bold text-slate-700">Total Tenur</TableHead>
              <TableHead className="font-bold text-slate-700">Akhir Kontrak</TableHead>
              <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
              <TableHead className="font-bold text-slate-700 text-right pr-6">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-slate-500">
                  Belum ada data karyawan. Silakan tambah data baru.
                </TableCell>
              </TableRow>
            ) : (
              data.map((emp) => {
                const latestContract = emp.contracts[0];
                const totalTenureMonths = calculateTotalTenure(emp.contracts);
                const daysRemaining = latestContract 
                  ? differenceInDays(new Date(latestContract.traineeSelesai), today) 
                  : null;
                const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30 && daysRemaining >= 0;

                return (
                  <TableRow 
                    key={emp.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${isExpiringSoon ? 'bg-amber-50/50' : ''}`}
                  >
                    <TableCell className="font-medium">{emp.nik || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{emp.namaLengkap}</span>
                        {isExpiringSoon && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase">
                            <AlertCircle className="w-3 h-3" /> Warning: Segera Selesai
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{emp.cabang}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {latestContract?.posisi || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-medium">{totalTenureMonths} Bulan</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${isExpiringSoon ? 'text-amber-700 font-bold' : 'text-slate-600'}`}>
                        {latestContract 
                          ? format(new Date(latestContract.traineeSelesai), 'dd MMM yyyy', { locale: localeID }) 
                          : '-'}
                      </span>
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
                      <div className="flex justify-end gap-2">
                        <Link href={`/karyawan/${emp.id}`}>
                          <Button variant="outline" size="sm" className="h-8">Detail</Button>
                        </Link>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={isDeleting === emp.id}
                            >
                              {isDeleting === emp.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Data Karyawan?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Menghapus data <span className="font-bold text-slate-900">{emp.namaLengkap}</span> akan menghapus seluruh riwayat kontrak terkait secara permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(emp.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ya, Hapus Data
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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