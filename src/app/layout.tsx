import './globals.css';
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: 'HRIS Astra Motor Kalimantan Barat',
  description: 'Sistem Informasi Manajemen Karyawan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans antialiased text-slate-900">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}