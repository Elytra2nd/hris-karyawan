'use client';

import { useState, useEffect } from 'react';
import { Camera, CircleNotch, CloudArrowUpIcon, CheckCircle, Warning } from '@phosphor-icons/react';
import { uploadEmployeePhoto } from '@/app/actions/upload';
import { toast } from 'sonner';

export function ImageUpload({ employeeId, currentImage }: { employeeId: string, currentImage?: string }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Bersihkan memory object URL dari browser saat preview berubah atau component unmount
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setUploadState('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await uploadEmployeePhoto(formData, employeeId);
      if (result.success) {
        setUploadState('success');
        toast.success('Foto berhasil diperbarui');
        // Reset state after 2s
        setTimeout(() => setUploadState('idle'), 2000);
      } else {
        setUploadState('error');
        toast.error(result.message ?? 'Gagal mengunggah foto');
        setTimeout(() => setUploadState('idle'), 3000);
      }
    } catch {
      setUploadState('error');
      toast.error('Koneksi terputus — coba unggah ulang');
      setTimeout(() => setUploadState('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

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

        {/* Overlay saat uploading */}
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
            <CircleNotch className="w-7 h-7 animate-spin text-white" />
            <span className="text-xs text-white font-semibold">Mengunggah...</span>
          </div>
        )}
        {uploadState === 'success' && !loading && (
          <div className="absolute inset-0 bg-green-500/70 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        )}
        {uploadState === 'error' && !loading && (
          <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
            <Warning className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Status label */}
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
          Gagal mengunggah — coba pilih foto lagi
        </div>
      )}

      {/* Upload button */}
      <label className={`cursor-pointer ${loading ? 'pointer-events-none opacity-60' : ''}`}>
        <input type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" disabled={loading} />
        <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
          <CloudArrowUpIcon className="w-4 h-4" />
          {loading ? 'Mengunggah...' : 'Pilih Foto'}
        </div>
      </label>

      <p className="text-xs text-muted-foreground">Format: JPG, PNG, WebP · Maks 2MB</p>
    </div>
  );
}
