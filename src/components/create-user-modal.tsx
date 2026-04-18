'use client';

import { useState } from 'react';
import { createUser } from '@/app/actions/user';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent,SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateUserModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    
    const formData = new FormData(event.currentTarget);
    try {
      const result = await createUser(formData);
      if (result.success) {
        toast.success("User berhasil dibuat");
        setOpen(false);
      }
    } catch (error) {
      toast.error("Gagal membuat user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-700 hover:bg-blue-800 font-bold uppercase text-[11px] tracking-widest shadow-lg shadow-blue-100">
          <Plus className="w-4 h-4 mr-2" /> Tambah Akun
        </Button>
      </DialogTrigger>
      <DialogContent className="font-sans">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter">Tambah User Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="Masukkan username..." required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role Akses</Label>
            <Select name="role" defaultValue="VIEWER">
              <SelectTrigger>
                <SelectValue placeholder="Pilih Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN (Full Access)</SelectItem>
                <SelectItem value="VIEWER">VIEWER (Read Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-blue-700 font-bold" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              SIMPAN AKUN
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}