'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { SignOut } from '@phosphor-icons/react'; // Icon bawaan Shadcn (Lucide)

export default function LogoutButton() {
  return (
    <Button 
      variant="destructive" 
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-2"
    >
      <SignOut className="w-4 h-4" />
      Keluar Sistem
    </Button>
  );
}