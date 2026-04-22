import { verifySession } from '@/lib/dal';
import { createEmployee } from '@/app/actions/employee';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EmployeeForm } from '@/components/employee-form';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function TambahKaryawanPage() {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') redirect('/karyawan');
  return (
    <div style={{ fontFamily: F }}>
      <Link href="/karyawan" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
        <ChevronLeft size={18} /> Kembali
      </Link>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Tambah Karyawan Baru</h1>
        <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24 }}>Input identitas diri dan masa kontrak awal sesuai aturan jabatan.</p>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24 }}>
          <EmployeeForm action={createEmployee} />
        </div>
      </div>
    </div>
  );
}