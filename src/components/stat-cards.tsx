'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ShieldCheck, UserCircle, Gear } from '@phosphor-icons/react';
import Link from 'next/link';
import { ExportExcelButton } from './export-excel-button';

interface StatCardsProps {
  user: { username: string; role: string };
  type: 'profile' | 'actions';
}

export function StatCards({ user, type }: StatCardsProps) {
  if (type === 'profile') {
    return (
      <Card className="border-none shadow-sm bg-card overflow-hidden h-full border-l-4 border-l-primary">
        <CardContent className="p-4 flex items-center gap-4 h-full">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
            <UserCircle className="h-6 w-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-none mb-1.5">
              Sesi Aktif
            </p>
            <h3 className="text-sm font-bold text-foreground truncate">
              {user.username}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-primary">
                {user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-card overflow-hidden h-full border-l-4 border-l-border">
      <CardContent className="p-4 flex flex-col justify-center h-full gap-2">
        <div className="flex items-center gap-2">
          <Gear className="w-3.5 h-3.5 text-muted-foreground/70" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Manajemen Data
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-50">
          {user.role === 'ADMIN' || user.role === 'HR_MANAGER' || user.role === 'HR_STAFF' ? (
            <>
              <Link href="/karyawan/tambah" className="w-full">
                <Button
                  size="sm"
                  className="h-8 w-full px-3 gap-2 text-xs font-semibold shadow-sm transition-all active:scale-95"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Tambah Karyawan</span>
                </Button>
              </Link>

              {(user.role === 'ADMIN' || user.role === 'HR_MANAGER') && (
                <div className="w-full">
                  <ExportExcelButton />
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground/70 w-full border border-dashed border-border text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/50" />
              Akses Terbatas
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
