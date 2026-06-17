import './globals.css';
import type { Viewport } from 'next';
import { Toaster } from "@/components/ui/sonner";
import { RootThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: 'TMS - Trainee Monitoring System',
  description: 'Trainee Monitoring System - Astra Motor Kalimantan Barat',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e40af',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased text-foreground">
        <RootThemeProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </RootThemeProvider>
      </body>
    </html>
  );
}