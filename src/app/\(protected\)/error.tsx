'use client';

import { useEffect } from 'react';
import { AlertTriangle } from '@phosphor-icons/react';
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
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-600 dark:text-red-400" weight="fill" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Terjadi Kesalahan</h1>
          <p className="text-sm text-muted-foreground">
            {error.message || 'Sesuatu tidak berjalan dengan semestinya. Silakan coba lagi.'}
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={() => window.history.back()} className="flex-1">
            Kembali
          </Button>
          <Button onClick={() => reset()} className="flex-1">
            Coba Lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
