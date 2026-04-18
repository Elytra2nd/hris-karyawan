'use client';

import { useState, useEffect } from 'react';
import { getEmployees, deleteEmployee } from '@/app/actions/employee';
import { FilterBar } from '@/components/filter-bar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  UserCircle2, 
  Eye, 
  Pencil, 
  FileClock,
  Trash2,
  ShieldAlert
} from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSidebar } from "@/components/ui/sidebar"; // Gunakan context sidebar untuk ambil role
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from "sonner";

export default function DataKaryawanPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: '', cabang: '', status: '' });
  
  // Ambil Role dari Sidebar Context (yang sudah kita pasang di layout)
  const { role } = useSidebar();
  const isAdmin = role === 'ADMIN';

  const fetchData = async () => {
    setLoading(true);
    const data = await getEmployees(filters);
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
        toast.error("Akses Ditolak", { description: "Hanya Admin yang dapat menghapus data." });
        return;
    }
    
    setIsDeleting(id);
    try {
      const result = await deleteEmployee(id);
      if (result.success) {
        toast.success("Berhasil!", {
          description: `Data karyawan ${name} telah dihapus.`,
        });
        await fetchData();
      } else {
        toast.error("Gagal!", {
          description: result.error || "Terjadi kesalahan saat menghapus data.",
        });
      }
    } catch (error) {
      toast.error("Error!", {
        description: "Gagal menghubungkan ke server.",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            Database Karyawan 
            {!isAdmin && <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 uppercase">Viewer Mode</Badge>}
          </h1>
          <p className="text-sm text-slate-500 font-medium italic">
            Kelola profil dan riwayat kontrak karyawan secara langsung.
          </p>
        </div>
        
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
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                  </TableCell>
                </TableRow>
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-400 font-medium italic">
                    Tidak ada data karyawan ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp: any) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          {emp.image ? (
                            <img src={emp.image} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <UserCircle2 className="w-5 h-5" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-900 truncate uppercase text-[11px]">{emp.namaLengkap}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter leading-none mt-1">{emp.region}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] font-bold text-slate-600 italic">
                      {emp.nik || '-'}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">
                      {emp.cabang}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-slate-600 uppercase">
                      {emp.contracts[0]?.posisi || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={
                        emp.status === 'AKTIF' 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] font-bold" 
                        : "bg-red-50 text-red-700 border-red-100 text-[9px] font-bold"
                      }>
                        {emp.status}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <TooltipProvider>
                          {/* DETAIL - BOLEH SEMUA ROLE */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/karyawan/${emp.id}`}>
                                <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 text-blue-600 hover:bg-blue-50 shadow-none">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-[10px] font-bold uppercase">Detail</p></TooltipContent>
                          </Tooltip>

                          {/* EDIT & KONTRAK - HANYA ADMIN */}
                          {isAdmin && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/karyawan/${emp.id}/edit`}>
                                    <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 text-emerald-600 hover:bg-emerald-50 shadow-none">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-[10px] font-bold uppercase">Edit</p></TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link href={`/karyawan/${emp.id}/kontrak`}>
                                    <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 text-amber-600 hover:bg-amber-50 shadow-none">
                                      <FileClock className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent><p className="text-[10px] font-bold uppercase">Kontrak</p></TooltipContent>
                              </Tooltip>

                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8 border-slate-200 text-red-500 hover:bg-red-50 shadow-none"
                                        disabled={isDeleting === emp.id}
                                      >
                                        {isDeleting === emp.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent><p className="text-[10px] font-bold uppercase">Hapus</p></TooltipContent>
                                </Tooltip>
                                
                                <AlertDialogContent className="font-sans">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                      Hapus Data Karyawan?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-500 font-medium">
                                      Tindakan ini tidak dapat dibatalkan. Menghapus data <span className="font-bold text-slate-900">{emp.namaLengkap}</span> akan menghapus seluruh riwayat kontrak terkait secara permanen.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="mt-4">
                                    <AlertDialogCancel className="font-bold border-slate-200 text-slate-600">BATAL</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(emp.id, emp.namaLengkap)}
                                      className="bg-red-600 hover:bg-red-700 text-white font-black"
                                    >
                                      YA, HAPUS DATA
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}

                          {/* JIKA VIEWER, BERI TANDA AKSES TERBATAS */}
                          {!isAdmin && (
                             <Tooltip>
                                <TooltipTrigger asChild>
                                   <div className="h-8 w-8 flex items-center justify-center text-slate-300">
                                      <ShieldAlert className="h-4 w-4" />
                                   </div>
                                </TooltipTrigger>
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