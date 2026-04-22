import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { updateEmployee } from '@/app/actions/employee';
import { EditKaryawanForm } from '@/components/edit-karyawan-form';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function EditKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  if (session?.role !== 'ADMIN') redirect('/karyawan');
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) notFound();
  const updateEmployeeWithId = updateEmployee.bind(null, id);

  return (
    <div style={{ fontFamily: F }}>
      <Link href={`/karyawan/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#64748B', textDecoration: 'none', marginBottom: 20 }}>
        <ChevronLeft size={18} /> Kembali
      </Link>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 24 }}>Edit Karyawan</h1>
        <EditKaryawanForm employee={employee} updateAction={updateEmployeeWithId} />
      </div>
    </div>
  );
}