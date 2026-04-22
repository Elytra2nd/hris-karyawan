import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { createContract } from '@/app/actions/employee';
import { ContractForm } from '@/components/contract-form';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft, AlertTriangle } from 'lucide-react';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function TambahKontrakPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') redirect('/karyawan');
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id }, select: { namaLengkap: true } });
  if (!employee) notFound();

  return (
    <div style={{ fontFamily: F }}>
      <Link href={`/karyawan/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
        <ChevronLeft size={18} /> Kembali
      </Link>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Tambah Kontrak Baru</h1>
        <p style={{ fontSize: 14, color: '#94A3B8', marginBottom: 24 }}>
          Menerbitkan kontrak baru untuk: <strong style={{ color: '#1E293B' }}>{employee.namaLengkap}</strong>
        </p>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, marginBottom: 16 }}>
          <ContractForm employeeId={id} action={createContract} />
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 13, color: '#92400E' }}>
          <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Aturan Kontrak:</strong> Jabatan Administrasi = 3 bulan, lainnya = 6 bulan. Tanggal selesai dihitung otomatis.
          </div>
        </div>
      </div>
    </div>
  );
}