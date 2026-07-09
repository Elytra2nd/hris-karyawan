'use client';

import { useState, useRef } from 'react';
import { Camera, CircleNotch, CloudArrowUp, CheckCircle, Warning } from '@phosphor-icons/react';
import { compressImage } from '@/lib/compress-image';
import { toast } from 'sonner';

export function ImageUpload({ employeeId, currentImage }: { employeeId: string, currentImage?: string }) {
  const [preview, setPreview] = useState(currentImage);
  const [uploadState, setUploadState] = useState<'idle' | 'compressing' | 'uploading' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Cabut blob URL lama sebelum membuat yang baru untuk mencegah memory leak.
  const revokeCurrentBlob = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simpan preview asli untuk rollback jika upload gagal.
    const originalPreview = preview;

    // Tampilkan preview lokal segera (sebelum kompresi).
    const rawBlobUrl = URL.createObjectURL(file);
    revokeCurrentBlob();
    blobUrlRef.current = rawBlobUrl;
    setPreview(rawBlobUrl);
    setUploadState('compressing');

    try {
      // Kompres gambar di sisi client sebelum upload.
      const compressed = await compressImage(file);

      // Perbarui preview ke versi terkompres.
      const compressedBlobUrl = URL.createObjectURL(compressed.blob);
      revokeCurrentBlob();
      blobUrlRef.current = compressedBlobUrl;
      setPreview(compressedBlobUrl);
      setUploadState('uploading');

      const formData = new FormData();
      // Gunakan blob langsung (bukan new File([blob])) untuk menghindari
      // bug serialisasi Next.js Server Actions yang menghasilkan size=0 di server.
      formData.append('file', compressed.blob, compressed.name);
      formData.append('employeeId', employeeId);

      const response = await fetch(`/api/upload?action=photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Gagal berkomunikasi dengan server');
      }

      const result = await response.json();

      if (result.success) {
        setUploadState('success');
        const sizeKb = Math.round(compressed.size / 1024);
        toast.success(`Foto berhasil diperbarui (${sizeKb} KB)`);
        setTimeout(() => setUploadState('idle'), 2000);
        // Biarkan preview blob URL tetap tampil — sudah mewakili gambar terbaru.
      } else {
        setUploadState('error');
        toast.error(result.message ?? 'Gagal mengunggah foto');
        // Rollback: tampilkan foto sebelumnya.
        revokeCurrentBlob();
        setPreview(originalPreview);
        setTimeout(() => setUploadState('idle'), 3000);
      }
    } catch {
      setUploadState('error');
      toast.error('Koneksi terputus - coba unggah ulang');
      revokeCurrentBlob();
      setPreview(originalPreview);
      setTimeout(() => setUploadState('idle'), 3000);
    } finally {
      // Reset input agar file yang sama bisa dipilih ulang jika gagal.
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isLoading = uploadState === 'compressing' || uploadState === 'uploading';

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-2xl bg-muted/50 border-border">
      {/* Photo preview */}
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-card shadow-md bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/70">
            <Camera className="w-10 h-10" />
          </div>
        )}

        {/* Overlay saat memproses */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
            <CircleNotch className="w-7 h-7 animate-spin text-white" />
            <span className="text-xs text-white font-semibold">
              {uploadState === 'compressing' ? 'Mengompres...' : 'Mengunggah...'}
            </span>
          </div>
        )}
        {uploadState === 'success' && (
          <div className="absolute inset-0 bg-green-500/70 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        )}
        {uploadState === 'error' && (
          <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
            <Warning className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Status label */}
      {uploadState === 'compressing' && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
          <CircleNotch size={12} className="animate-spin" />
          Mengompres foto...
        </div>
      )}
      {uploadState === 'uploading' && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
          <CircleNotch size={12} className="animate-spin" />
          Sedang mengunggah foto...
        </div>
      )}
      {uploadState === 'success' && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold">
          <CheckCircle size={12} />
          Foto berhasil diperbarui
        </div>
      )}
      {uploadState === 'error' && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold">
          <Warning size={12} />
          Gagal mengunggah - coba pilih foto lagi
        </div>
      )}

      {/* Upload button */}
      <label className={`cursor-pointer ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          disabled={isLoading}
        />
        <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          <CloudArrowUp className="w-4 h-4" />
          {isLoading ? (uploadState === 'compressing' ? 'Mengompres...' : 'Mengunggah...') : 'Pilih Foto'}
        </div>
      </label>

      <p className="text-xs text-muted-foreground">Format: JPG, PNG, WebP · Maks 2MB · Dikompres otomatis</p>
    </div>
  );
}
