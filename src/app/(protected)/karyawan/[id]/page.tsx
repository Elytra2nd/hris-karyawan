import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { differenceInMonths, differenceInDays, format } from 'date-fns';
import { ChevronLeft, User, MapPin, Phone, CreditCard, Clock, CalendarDays, Pencil, PlusCircle, Building2, FileCheck, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { ContractList } from '@/components/contract-list';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function DetailKaryawanPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession();
  const { id } = await params;
  const isAdmin = session?.role === 'ADMIN';

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { contracts: { orderBy: { traineeSelesai: 'desc' } } },
  });
  if (!employee) notFound();

  const totalMonths = employee.contracts.reduce((acc, c) => acc + differenceInMonths(new Date(c.traineeSelesai), new Date(c.traineeSejak)), 0);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const latestContract = employee.contracts[0];
  const daysToExpiry = latestContract ? differenceInDays(new Date(latestContract.traineeSelesai), new Date()) : 0;

  return (
    <div style={{ fontFamily: F }}>
      {/* NAV + ACTIONS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link href="/karyawan" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#64748B', textDecoration: 'none' }}>
          <ChevronLeft size={18} /> Kembali ke Data Karyawan
        </Link>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/karyawan/${id}/edit`} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#475569', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                <Pencil size={14} /> Edit Profil
              </button>
            </Link>
            <Link href={`/karyawan/${id}/kontrak`} style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#1E293B', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                <PlusCircle size={14} /> Perbarui Kontrak
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* PROFILE CARD */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {employee.image ? <img src={employee.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={36} color="#94A3B8" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>{employee.namaLengkap}</h1>
              <StatusBadge status={employee.status} days={daysToExpiry} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#64748B' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CreditCard size={14} color="#94A3B8" /> NIK: {employee.nik || '-'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} color="#94A3B8" /> {employee.cabang}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={14} color="#94A3B8" /> {employee.noHp || '-'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={14} color="#94A3B8" /> {latestContract?.posisi || '-'}</span>
            </div>
          </div>
        </div>

        {/* MASA KERJA + SISA KONTRAK */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, borderRight: '1px solid #F1F5F9' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Masa Kerja Akumulasi</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{years > 0 ? `${years} Tahun ` : ''}{months} Bulan</div>
            </div>
          </div>
          <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, background: daysToExpiry <= 30 ? '#FEF2F2' : '#F0FDF4' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: daysToExpiry <= 30 ? '#FEE2E2' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={18} color={daysToExpiry <= 30 ? '#DC2626' : '#059669'} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: daysToExpiry <= 30 ? '#DC2626' : '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sisa Kontrak</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{daysToExpiry > 0 ? `${daysToExpiry} Hari` : 'Habis'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ALL DATA — 3 SECTIONS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* IDENTITAS PRIBADI */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <SectionTitle icon={<User size={14} color="#3B82F6" />} title="Identitas Pribadi" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <InfoItem label="Nama Lengkap" value={employee.namaLengkap} />
            <InfoItem label="NIK Karyawan" value={employee.nik || '-'} />
            <InfoItem label="No KTP" value={employee.noKtp} mono />
            <InfoItem label="Tanggal Lahir" value={employee.tglLahir ? format(new Date(employee.tglLahir), 'dd MMMM yyyy') : '-'} />
            <InfoItem label="Nama Ibu Kandung" value={employee.namaIbu} />
            <InfoItem label="No HP / WhatsApp" value={employee.noHp || '-'} />
            <InfoItem label="No Jamsostek" value={employee.noJamsostek || '-'} mono />
            <InfoItem label="Status" value={employee.status} />
          </div>
        </div>

        {/* DATA OPERASIONAL */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <SectionTitle icon={<Building2 size={14} color="#10B981" />} title="Data Operasional" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
            <InfoItem label="Branch Code (BA)" value={employee.ba} mono />
            <InfoItem label="BA Cabang" value={employee.baCabang} />
            <InfoItem label="Region" value={employee.region} />
            <InfoItem label="Cabang" value={employee.cabang} />
            <InfoItem label="Form Consent" value={employee.formConsent} />
            <InfoItem label="Posisi Terakhir" value={latestContract?.posisi || '-'} />
          </div>
        </div>
      </div>

      {/* DOKUMEN & META */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, marginBottom: 20 }}>
        <SectionTitle icon={<FileCheck size={14} color="#F97316" />} title="Dokumen & Metadata" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px 20px' }}>
          <DocStatus label="Foto Karyawan" available={!!employee.image} />
          <DocStatus label="Scan KTP" available={!!employee.ktpPath} />
          <DocStatus label="Scan KK" available={!!employee.kkPath} />
          <InfoItem label="Form Consent" value={employee.formConsent} />
          <InfoItem label="Data ID" value={employee.id.substring(0, 12) + '...'} mono />
          <InfoItem label="Dibuat" value={format(new Date(employee.createdAt), 'dd MMM yyyy, HH:mm')} />
          <InfoItem label="Diperbarui" value={format(new Date(employee.updatedAt), 'dd MMM yyyy, HH:mm')} />
          <InfoItem label="Total Kontrak" value={`${employee.contracts.length} kontrak`} />
        </div>
      </div>

      {/* RIWAYAT KONTRAK */}
      <ContractList employee={employee} contracts={employee.contracts} />
    </div>
  );
}

/* ============ SUB-COMPONENTS ============ */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>{title}</h3>
    </div>
  );
}

function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#1E293B', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status, days }: { status: string; days: number }) {
  let bg = '#ECFDF5', color = '#059669', border = '#A7F3D0', text = 'Aktif';
  if (status !== 'AKTIF') { bg = '#FEF2F2'; color = '#DC2626'; border = '#FECACA'; text = 'Non-Aktif'; }
  else if (days < 0) { bg = '#FEF2F2'; color = '#DC2626'; border = '#FECACA'; text = 'Expired'; }
  else if (days <= 30) { bg = '#FFF7ED'; color = '#EA580C'; border = '#FED7AA'; text = 'Segera Habis'; }
  return <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${border}` }}>{text}</span>;
}

function DocStatus({ label, available }: { label: string; available: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: available ? '#059669' : '#DC2626' }}>
        {available ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#DC2626" />}
        {available ? 'Tersedia' : 'Belum ada'}
      </div>
    </div>
  );
}