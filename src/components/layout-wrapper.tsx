'use client';

import { usePathname } from 'next/navigation';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export default function LayoutWrapper({ 
  children, 
  role,
  username,
}: { 
  children: React.ReactNode; 
  role?: string;
  username?: string;
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
        <SidebarProvider role={role} username={username}>
          <AppSidebar />
          <SidebarInset style={{ 
            display: 'flex', flexDirection: 'column', 
            minHeight: '100vh', backgroundColor: '#FAFBFC',
            overflowX: 'hidden',
          }}>
            <main style={{ 
              flex: 1, padding: '24px 32px', 
              width: '100%', maxWidth: 1400, margin: '0 auto',
              fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
            }}>
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  );
}