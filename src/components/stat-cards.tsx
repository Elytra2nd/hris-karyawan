'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, FileSpreadsheet, ShieldCheck, UserCircle, Settings2 } from 'lucide-react';
import Link from 'next/link';

interface StatCardsProps {
  user: { username: string; role: string };
  type: 'profile' | 'actions';
}

export function StatCards({ user, type }: StatCardsProps) {
  if (type === 'profile') {
    return (
      <Card className="border-none shadow-sm bg-white overflow-hidden h-full border-l-4 border-l-blue-600">
        <CardContent className="p-3 flex items-center gap-3 h-full">
          <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <UserCircle className="h-5 w-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Administrator</p>
            <h3 className="text-xs font-bold text-slate-800 truncate">{user.username}</h3>
            <span className="text-[9px] font-black text-blue-600 uppercase">● {user.role}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-white overflow-hidden h-full border-l-4 border-l-slate-800">
      <CardContent className="p-3 flex flex-col justify-center h-full gap-2">
        {/* Label Kecil di Atas */}
        <div className="flex items-center gap-2">
          <Settings2 className="w-3 h-3 text-slate-400" />
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Manajemen Data</p>
        </div>

        {/* Baris Tombol - Dibuat Full Width */}
        <div className="flex flex-col gap-1.5 w-full">
          {user.role === 'ADMIN' ? (
            <>
              <Link href="/karyawan/tambah" className="w-full">
                <Button size="sm" className="h-8 w-full px-2 gap-2 text-[10px] bg-slate-900 hover:bg-slate-800 shadow-sm">
                  <UserPlus className="h-3.5 w-3.5" /> Tambah Karyawan
                </Button>
              </Link>
              <Button size="sm" variant="outline" className="h-8 w-full px-2 gap-2 text-[10px] border-slate-200 hover:bg-slate-50">
                <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" /> Export Data Excel
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded text-[9px] font-bold text-slate-400 italic w-full border border-dashed border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5" /> AKSES TERBATAS (VIEWER)
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}