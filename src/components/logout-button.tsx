'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react'; // Icon bawaan Shadcn (Lucide)

export default function LogoutButton() {
  return (
    <Button 
      variant="destructive" 
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      Keluar Sistem
    </Button>
  );
}