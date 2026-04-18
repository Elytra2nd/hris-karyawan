'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // Tambahkan SidebarInset
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function LayoutWrapper({ 
  children, 
  role 
}: { 
  children: React.ReactNode; 
  role?: string 
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <TooltipProvider>
      {isLoginPage ? (
        <main className="min-h-screen w-full">
          {children}
        </main>
      ) : (
        <SidebarProvider role={role}>
          <AppSidebar />
          {/* Gunakan SidebarInset jika kamu pakai Shadcn Sidebar terbaru. 
            Jika tidak, gunakan wrapper div dengan margin left yang responsif.
          */}
          <SidebarInset className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden">
            <main className="flex-1 p-4 md:p-8 w-full max-w-[1600px] mx-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}