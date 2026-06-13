'use client';

import { useState, useEffect } from 'react';
import { getEmployees, deleteEmployee } from '@/app/actions/employee';
import { FilterBar } from '@/components/filter-bar';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, UserCircle2, Eye, Pencil, FileClock, Trash2, ShieldAlert 
} from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function DataKaryawanTable({ initialData, role }: { initialData: any[], role: string }) {
  const [employees, setEmployees] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', cabang: '', status: '' });
  
  const isAdmin = role === 'ADMIN';

  // Fetch data saat filter berubah
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getEmployees(filters);
      setEmployees(data);
      setLoading(false);
    };
    fetchData();
  }, [filters]);

  const handleDelete = async (id: string, name: string) => {
    setIsDeleting(id);
    const result = await deleteEmployee(id);
    if (result.success) {
      toast.success("Terhapus!", { description: `${name} telah dihapus dari sistem.` });
      setEmployees(employees.filter(e => e.id !== id));
    } else {
      toast.error("Gagal!", { description: result.error });
    }
    setIsDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {isAdmin && (
          <Link href="/karyawan/tambah">
            <Button className="bg-blue-700 hover:bg-blue-800 font-bold uppercase text-xs tracking-widest shadow-lg shadow-blue-100">
              Tambah Karyawan Baru
            </Button>
          </Link>
        )}
      </div>

      <FilterBar 
        onSearch={(val: string) => setFilters({ ...filters, search: val })}
        onFilterCabang={(val: string) => setFilters({ ...filters, cabang: val === 'ALL' ? '' : val })}
        onFilterStatus={(val: string) => setFilters({ ...filters, status: val === 'ALL' ? '' : val })}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-250">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-75 font-bold text-slate-700">Karyawan</TableHead>
                <TableHead className="font-bold text-slate-700">NIK</TableHead>
                <TableHead className="font-bold text-slate-700">Cabang</TableHead>
                <TableHead className="font-bold text-slate-700">Posisi</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Status</TableHead>
                <TableHead className="w-45 text-center font-bold text-slate-700 uppercase text-[10px] tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></TableCell></TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          {emp.image ? <img src={emp.image} className="w-full h-full rounded-full object-cover" /> : <UserCircle2 className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase text-[11px]">{emp.namaLengkap}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase">{emp.region}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-slate-600 italic">{emp.nik || '-'}</TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">{emp.cabang}</TableCell>
                    <TableCell className="text-[11px] font-medium text-slate-600 uppercase">{emp.contracts[0]?.posisi || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={emp.status === 'AKTIF' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/karyawan/${emp.id}`}>
                                <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 shadow-none"><Eye className="h-4 w-4" /></Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px] font-bold uppercase">Detail</p></TooltipContent>
                          </Tooltip>

                          {isAdmin ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/karyawan/${emp.id}/edit`}>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-emerald-600 shadow-none"><Pencil className="h-4 w-4" /></Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-[10px] font-bold uppercase">Edit</p></TooltipContent>
                              </Tooltip>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 shadow-none" disabled={isDeleting === emp.id}>
                                    {isDeleting === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="uppercase tracking-tighter font-black">Hapus Data Karyawan?</AlertDialogTitle>
                                    <AlertDialogDescription>Tindakan ini permanen. Data <span className="font-bold text-slate-900">{emp.namaLengkap}</span> akan dihapus dari database.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>BATAL</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(emp.id, emp.namaLengkap)} className="bg-red-600">YA, HAPUS</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild><ShieldAlert className="h-4 w-4 text-slate-300" /></TooltipTrigger>
                              <TooltipContent><p className="text-[10px] font-bold uppercase">Akses Terbatas</p></TooltipContent>
                            </Tooltip>
                          )}
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}