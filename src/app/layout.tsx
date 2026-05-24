import './globals.css';
import { Toaster } from "@/components/ui/sonner";
import { RootThemeProvider } from "@/components/theme-provider";

export const metadata = {
  title: 'HRIS Astra Motor Kalimantan Barat',
  description: 'Sistem Informasi Manajemen Karyawan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased text-slate-900">
        <RootThemeProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </RootThemeProvider>
      </body>
    </html>
  );
}