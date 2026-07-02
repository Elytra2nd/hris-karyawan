import Link from 'next/link'
import { MagnifyingGlass } from '@phosphor-icons/react/ssr'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <MagnifyingGlass size={32} className="text-primary" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-5xl font-extrabold text-foreground">404</p>
          <h1 className="text-xl font-bold text-foreground">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-muted-foreground">
            Halaman yang Anda cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        <Button asChild>
          <Link href="/">Kembali ke Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
