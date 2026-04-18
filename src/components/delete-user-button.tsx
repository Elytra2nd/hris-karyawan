'use client';

import { useState } from 'react';
import { deleteUser } from '@/app/actions/user';
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteUserButton({ id, username }: { id: string; username: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Hapus akun ${username}?`)) return;
    
    setLoading(true);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        toast.success("User berhasil dihapus");
      } else {
        toast.error(result.error || "Gagal menghapus user");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleDelete} 
      disabled={loading}
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </Button>
  );
}