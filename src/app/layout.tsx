import './globals.css';
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: 'HRIS Astra Motor Kalimantan Barat',
  description: 'Sistem Informasi Manajemen Karyawan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased text-slate-900" style={{ fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}