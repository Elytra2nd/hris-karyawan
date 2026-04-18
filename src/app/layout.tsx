import { Poppins } from 'next/font/google';
import './globals.css';
import LayoutWrapper from '@/components/layout-wrapper';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'HRIS PT. Multi Makmur',
  description: 'Sistem Informasi Manajemen Karyawan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${poppins.variable} font-sans antialiased text-slate-900`}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}