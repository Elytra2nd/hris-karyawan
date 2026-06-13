'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Download, ExternalLink, ImageIcon } from "lucide-react";

interface Props {
  path: string | null;
  label: string;
}

export default function DocumentPreviewer({ path, label }: Props) {
  const [open, setOpen] = useState(false);

  if (!path) return null;

  const isPDF = path.toLowerCase().endsWith('.pdf');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-[10px] uppercase tracking-wider"
        >
          <Eye className="w-3.5 h-3.5" /> Lihat {label}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 border-b bg-white shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tighter">
              {isPDF ? <FileText className="w-5 h-5 text-red-500" /> : <ImageIcon className="w-5 h-5 text-blue-500" />}
              Pratinjau Dokumen: {label}
            </DialogTitle>
            <div className="flex gap-2 pr-8">
              <Button variant="outline" size="sm" asChild className="h-8">
                <a href={path} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" /> Download
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4">
          {isPDF ? (
            <iframe
              src={`${path}#toolbar=0`}
              className="w-full h-full rounded-md shadow-inner bg-white"
              title={`Preview ${label}`}
            />
          ) : (
            <img
              src={path}
              alt={label}
              className="max-w-full max-h-full object-contain rounded-md shadow-lg"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}