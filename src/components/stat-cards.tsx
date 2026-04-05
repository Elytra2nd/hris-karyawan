'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ShieldCheck, UserCircle, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { ExportExcelButton } from './export-excel-button';

interface StatCardsProps {
  user: { username: string; role: string };
  type: 'profile' | 'actions';
}

export function StatCards({ user, type }: StatCardsProps) {
  // Tipe Profile: Menampilkan Identitas Pengguna
  if (type === 'profile') {
    return (
      <Card className="border-none shadow-sm bg-white overflow-hidden h-full border-l-4 border-l-blue-600 font-sans">
        <CardContent className="p-4 flex items-center gap-4 h-full">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">
              Sesi Aktif
            </p>
            <h3 className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">
              {user.username}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
                Otoritas: {user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tipe Actions: Tombol Manajemen berdasarkan Role (Dibuat Vertikal)
  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden h-full border-l-4 border-l-slate-800 font-sans">
      <CardContent className="p-4 flex flex-col justify-center h-full gap-2">
        {/* Label Grup Aksi */}
        <div className="flex items-center gap-2">
          <Settings2 className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Manajemen Data
          </p>
        </div>

        {/* Baris Tombol Interaktif: Diubah menjadi flex-col saja dan max-width dibatasi */}
        <div className="flex flex-col gap-2 w-full max-w-50">
          {user.role === 'ADMIN' ? (
            <>
              <Link href="/karyawan/tambah" className="w-full">
                <Button 
                  size="sm" 
                  className="h-8 w-full px-3 gap-2 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 shadow-md transition-all active:scale-95"
                >
                  <UserPlus className="h-3.5 w-3.5" /> 
                  <span>Tambah Karyawan</span>
                </Button>
              </Link>
              
              <div className="w-full">
                <ExportExcelButton />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-400 italic w-full border border-dashed border-slate-200 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-300" /> 
              AKSES TERBATAS
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}