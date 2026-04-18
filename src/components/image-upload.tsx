'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, UploadCloud } from 'lucide-react';
import { uploadEmployeePhoto } from '@/app/actions/upload';
import { toast } from 'sonner';

export function ImageUpload({ employeeId, currentImage }: { employeeId: string, currentImage?: string }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview lokal
    setPreview(URL.createObjectURL(file));

    // Proses Upload
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadEmployeePhoto(formData, employeeId);
    
    if (result.success) {
      toast.success("Foto berhasil diperbarui");
    } else {
      toast.error("Gagal mengunggah foto");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-2xl bg-slate-50 border-slate-200">
      <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200">
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Camera className="w-10 h-10" />
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>
      
      <label className="cursor-pointer">
        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
          <UploadCloud className="w-4 h-4" /> Pilih Foto
        </div>
      </label>
      <p className="text-[10px] text-slate-400 font-medium">Format: JPG, PNG (Max 2MB)</p>
    </div>
  );
}