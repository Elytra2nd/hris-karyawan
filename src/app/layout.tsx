'use client';

import { Poppins } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePathname } from 'next/navigation';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Deteksi halaman login
  const isLoginPage = pathname === '/login';

  return (
    <html lang="id">
      <body className={`${poppins.variable} font-sans antialiased text-slate-900`}>
        <TooltipProvider>
          {isLoginPage ? (
            // Layout Minimalis untuk Login
            // Menghapus bg-slate-100 agar menyatu dengan bg-slate-50 di LoginForm
            <main className="min-h-screen w-full">
              {children}
            </main>
          ) : (
            // Layout Dashboard dengan Sidebar
            <SidebarProvider>
              <AppSidebar />
              <div className="flex flex-col w-full min-h-screen bg-slate-50">
                {children}
              </div>
            </SidebarProvider>
          )}
        </TooltipProvider>
      </body>
    </html>
  );
}