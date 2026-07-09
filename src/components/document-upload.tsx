'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CircleNotch, CloudArrowUp, CheckCircle, XCircle, Eye, ArrowsClockwise } from '@phosphor-icons/react'
import { compressImage } from '@/lib/compress-image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Upload Scan KTP / KK — pola sama dengan foto profil: kalau belum ada tampil
// tombol unggah + info; kalau sudah ada tampil tombol Lihat + Ganti.
export function DocumentUpload({
  employeeId,
  kind,
  label,
  icon,
  currentPath,
  canUpload,
}: {
  employeeId: string
  kind: 'ktp' | 'kk' | 'foto'
  label: string
  icon: React.ReactNode
  currentPath?: string | null
  canUpload: boolean
}) {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'compressing' | 'uploading'>('idle')
  const available = !!currentPath
  // Foto = khusus gambar (maks 2MB). KTP/KK = gambar atau PDF (maks 5MB).
  const isFoto = kind === 'foto'
  const isImage = (f: File) => f.type.startsWith('image/')
  const accept = isFoto ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'
  const formatHint = isFoto ? 'JPG, PNG, atau WebP · Maks 2MB · Dikompres otomatis' : 'JPG, PNG, atau PDF · Maks 5MB'

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Kompres gambar sebelum upload (PDF dilewati).
      let uploadBlob: Blob = file
      let uploadName: string = file.name
      let uploadSize: number = file.size

      if (isImage(file)) {
        setStatus('compressing')
        const compressed = await compressImage(file)
        uploadBlob = compressed.blob
        uploadName = compressed.name
        uploadSize = compressed.size
      }

      setStatus('uploading')
      const formData = new FormData()
      // Gunakan blob langsung (bukan new File([blob])) untuk menghindari
      // bug serialisasi Next.js Server Actions yang menghasilkan size=0 di server.
      formData.append('file', uploadBlob, uploadName)
      formData.append('employeeId', employeeId)
      if (!isFoto) {
        formData.append('kind', kind)
      }

      const urlParam = isFoto ? 'photo' : 'document'
      const response = await fetch(`/api/upload?action=${urlParam}`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Gagal berkomunikasi dengan server')
      }

      const result = await response.json()

      if (result.success) {
        const sizeKb = Math.round(uploadSize / 1024)
        toast.success(`${label} berhasil diunggah (${sizeKb} KB)`)
        router.refresh()
      } else {
        toast.error(result.message ?? 'Gagal mengunggah dokumen')
      }
    } catch {
      toast.error('Koneksi terputus - coba unggah ulang')
    } finally {
      setStatus('idle')
      e.target.value = '' // reset agar file sama bisa dipilih lagi
    }
  }

  const loading = status !== 'idle'
  const loadingLabel = status === 'compressing' ? 'Mengompres…' : 'Mengunggah…'

  return (
    <div className={cn(
      'rounded-lg border p-4 flex flex-col items-center text-center gap-2',
      available ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20' : 'border-border bg-muted/50'
    )}>
      <div className={cn(
        'h-10 w-10 rounded-lg flex items-center justify-center',
        available ? 'bg-card' : 'bg-muted'
      )}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-foreground/70 leading-snug">{label}</p>

      {available ? (
        <a href={currentPath!} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
          <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            <CheckCircle size={12} /> Tersedia
          </Badge>
        </a>
      ) : (
        <Badge variant="outline" className="gap-1 text-muted-foreground font-normal">
          <XCircle size={12} /> Belum ada
        </Badge>
      )}

      {canUpload && (
        <div className="mt-1 flex flex-col items-center gap-1">
          <label className={cn('cursor-pointer', loading && 'pointer-events-none opacity-60')}>
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
              disabled={loading}
            />
            <span className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              available
                ? 'border border-border bg-card text-foreground/70 hover:bg-muted/60'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}>
              {loading ? (
                <><CircleNotch size={13} className="animate-spin" /> {loadingLabel}</>
              ) : available ? (
                <><ArrowsClockwise size={13} /> Ganti</>
              ) : (
                <><CloudArrowUp size={13} /> Unggah</>
              )}
            </span>
          </label>
          {available && currentPath && (
            <a
              href={currentPath}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              <Eye size={11} /> Lihat file
            </a>
          )}
        </div>
      )}

      {canUpload && !available && (
        <p className="text-[10px] text-muted-foreground/80 leading-tight">{formatHint}</p>
      )}
    </div>
  )
}
