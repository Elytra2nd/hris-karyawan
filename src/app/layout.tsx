import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip"; // Impor ini

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HRIS Karyawan',
  description: 'Sistem Database Kontrak Karyawan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* TooltipProvider harus membungkus SidebarProvider agar fitur tooltip di sidebar aktif */}
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-col w-full min-h-screen bg-slate-50">
              {children}
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}