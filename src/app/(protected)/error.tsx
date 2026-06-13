'use client';

import { useEffect } from 'react';
import { Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background px-4">
      <div role="alert" className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Warning size={32} className="text-red-600 dark:text-red-400" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Ada yang Tidak Beres</h1>
          <p className="text-sm text-muted-foreground">
            Kami sedang mengalami gangguan. Coba muat ulang halaman atau kembali ke halaman sebelumnya.
          </p>
        </div>

        <div className="flex gap-4 w-full">
          <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
            Kembali
          </Button>
          <Button onClick={() => reset()} className="flex-1">
            Muat Ulang
          </Button>
        </div>
      </div>
    </div>
  );
}
