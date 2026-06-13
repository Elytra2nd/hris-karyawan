'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { uploadEmployeeDocument } from "@/app/actions/upload";
import { Loader2, UploadCloud, FileText, ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  employeeId: string;
  type: 'ktpPath' | 'kkPath';
  label: string; // Misal: "Upload KTP"
}

export default function DocumentUploadModal({ employeeId, type, label }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validasi sederhana di sisi Client sebelum dikirim ke Server
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error("File terlalu besar", { description: "Maksimal ukuran file adalah 2MB" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await uploadEmployeeDocument(employeeId, formData, type);
      
      if (res.success) {
        toast.success("Berhasil!", { description: `${label} telah diarsipkan.` });
        setOpen(false);
        setFile(null);
      } else {
        toast.error("Gagal Upload", { description: res.error });
      }
    } catch (error) {
      toast.error("Error", { description: "Terjadi kesalahan pada server." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-bold uppercase text-[10px] tracking-wider border-slate-200">
          <UploadCloud className="w-3.5 h-3.5" /> {label}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px] font-sans">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter text-slate-900">
            Arsip Digital: {label}
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium text-sm">
            Format yang didukung: JPG, PNG, atau PDF. Maksimal 2MB.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <label 
            htmlFor={`file-upload-${type}`}
            className={`
              flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all
              ${file ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {file ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-sm font-bold text-emerald-700 truncate max-w-[250px]">{file.name}</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Klik untuk pilih dokumen</p>
                </>
              )}
            </div>
            <input 
              id={`file-upload-${type}`} 
              type="file" 
              className="hidden" 
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            disabled={isUploading}
            className="font-bold text-slate-500"
          >
            BATAL
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="bg-blue-700 hover:bg-blue-800 text-white font-black px-6"
          >
            {isUploading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> MENGARSIPKAN...</>
            ) : (
              "SIMPAN ARSIP"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}