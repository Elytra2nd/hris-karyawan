import { verifySession } from '@/lib/dal';
import { prisma } from '@/lib/prisma';
import { startOfDay, addDays, format, differenceInDays } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Users, UserCheck, UserX, AlertTriangle, TrendingUp, Building2, MapPin, Clock, PlusCircle, Download, BarChart3, FileText } from 'lucide-react';
import Link from 'next/link';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function DashboardPage() {
  const user = await verifySession();
  const now = new Date();
  const today = startOfDay(now);
  const thirtyDays = addDays(today, 30);
  const ninetyDays = addDays(today, 90);

  // --- CORE QUERIES ---
  const [totalEmployees, activeEmployees, statsBranch, recentContracts] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'AKTIF' } }),
    prisma.employee.groupBy({ by: ['ba', 'baCabang', 'cabang', 'region'], _count: { ba: true }, orderBy: { _count: { ba: 'desc' } } }),
    // Kontrak terakhir per karyawan aktif (untuk hitung status kontrak + distribusi posisi)
    prisma.contract.findMany({
      where: { employee: { status: 'AKTIF' } },
      orderBy: { traineeSelesai: 'desc' },
      distinct: ['employeeId'],
      include: { employee: { select: { namaLengkap: true, cabang: true, id: true } } },
    }),
  ]);

  const nonActive = totalEmployees - activeEmployees;
  const activePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100) : 0;

  // --- DERIVED FROM LATEST CONTRACTS (accurate) ---
  const expiring30 = recentContracts.filter(c => {
    const d = differenceInDays(new Date(c.traineeSelesai), today);
    return d >= 0 && d <= 30;
  });
  const expiring90 = recentContracts.filter(c => {
    const d = differenceInDays(new Date(c.traineeSelesai), today);
    return d >= 0 && d <= 90;
  });
  const safe = recentContracts.filter(c => differenceInDays(new Date(c.traineeSelesai), today) > 90);
  const expired = recentContracts.filter(c => differenceInDays(new Date(c.traineeSelesai), today) < 0);

  // Distribusi posisi dari kontrak TERAKHIR karyawan aktif saja
  const posisiMap: Record<string, number> = {};
  recentContracts.forEach(c => { posisiMap[c.posisi] = (posisiMap[c.posisi] || 0) + 1; });
  const statsPosisi = Object.entries(posisiMap).sort((a, b) => b[1] - a[1]);
  const maxPosisi = statsPosisi.length > 0 ? Math.max(...statsPosisi.map(s => s[1])) : 1;

  // Sebaran cabang dari employee
  const cabangMap: Record<string, number> = {};
  recentContracts.forEach(c => { cabangMap[c.employee.cabang] = (cabangMap[c.employee.cabang] || 0) + 1; });
  const statsCabang = Object.entries(cabangMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Kontrak segera habis (sorted by urgency)
  const urgentList = [...expiring30, ...expiring90.filter(c => !expiring30.includes(c))].slice(0, 6);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div style={{ fontFamily: F }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E293B', margin: 0 }}>
            {greeting}, {user?.username || 'User'}
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
            Dashboard HRIS — Astra Motor Kalimantan Barat
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* QUICK ACTIONS */}
          {user?.role === 'ADMIN' && (
            <Link href="/karyawan/tambah" style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 13, fontWeight: 600, color: '#fff', background: '#1E293B', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: F }}>
                <PlusCircle size={14} /> Tambah Karyawan
              </button>
            </Link>
          )}
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', fontWeight: 500 }}>
              <Clock size={14} color="#94A3B8" />
              {format(now, "EEEE, dd MMMM yyyy", { locale: localeID })}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
              {format(now, "HH:mm 'WIB'")}
            </div>
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <GradientCard bg="linear-gradient(135deg, #3B82F6, #1D4ED8)" icon={<Users size={20} color="#fff" />} value={totalEmployees} label="Total Karyawan" sub="Seluruh database" />
        <GradientCard bg="linear-gradient(135deg, #10B981, #059669)" icon={<UserCheck size={20} color="#fff" />} value={activeEmployees} label="Karyawan Aktif" sub={`${activePercent}% dari total`} />
        <GradientCard bg="linear-gradient(135deg, #F97316, #EA580C)" icon={<UserX size={20} color="#fff" />} value={nonActive} label="Non-Aktif" sub="Expired / Keluar" />
        <GradientCard bg="linear-gradient(135deg, #EF4444, #DC2626)" icon={<AlertTriangle size={20} color="#fff" />} value={expiring30.length} label="Kontrak Kritis" sub="< 30 hari tersisa" />
      </div>

      {/* ALERT */}
      {expiring30.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={18} color="#DC2626" />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>{expiring30.length} kontrak akan habis dalam 30 hari</span>
            <span style={{ fontSize: 13, color: '#94A3B8', marginLeft: 8 }}>Segera lakukan perpanjangan.</span>
          </div>
          <Link href="/karyawan" style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', textDecoration: 'none' }}>Lihat Detail →</Link>
        </div>
      )}

      {/* 2-COL: KONTRAK SEGERA HABIS + RINGKASAN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Kontrak Segera Habis */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={14} color="#DC2626" /></div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Kontrak Segera Habis</h3>
            </div>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>{expiring90.length} total</span>
          </div>
          {urgentList.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Semua kontrak aman.</div>
          ) : urgentList.map((c: any) => {
            const days = differenceInDays(new Date(c.traineeSelesai), now);
            const isKritis = days <= 30;
            return (
              <Link key={c.id} href={`/karyawan/${c.employee.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.employee.namaLengkap}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{c.posisi} · {c.employee.cabang}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isKritis ? '#FEF2F2' : '#FFF7ED', color: isKritis ? '#DC2626' : '#EA580C', border: `1px solid ${isKritis ? '#FECACA' : '#FED7AA'}` }}>
                    {days > 0 ? `${days} hari` : 'Expired'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Ringkasan Status (data akurat dari kontrak terakhir) */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={14} color="#3B82F6" /></div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Ringkasan Kontrak Aktif</h3>
          </div>
          <SummaryRow label="Kontrak Aman" value={safe.length} color="#059669" sub="> 90 hari" icon={<UserCheck size={12} color="#059669" />} />
          <SummaryRow label="Perlu Perhatian" value={expiring90.length - expiring30.length} color="#D97706" sub="30–90 hari" icon={<Clock size={12} color="#D97706" />} />
          <SummaryRow label="Kritis" value={expiring30.length} color="#DC2626" sub="< 30 hari" icon={<AlertTriangle size={12} color="#DC2626" />} />
          <SummaryRow label="Sudah Expired" value={expired.length} color="#94A3B8" sub="Kontrak habis" icon={<UserX size={12} color="#94A3B8" />} />
          <div style={{ marginTop: 12, padding: '10px 0', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
            <span style={{ color: '#1E293B' }}>Total Karyawan Aktif</span>
            <span style={{ color: '#1E293B' }}>{activeEmployees}</span>
          </div>
          <div style={{ padding: '6px 0', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#94A3B8' }}>Non-Aktif / Keluar</span>
            <span style={{ color: '#94A3B8' }}>{nonActive}</span>
          </div>
        </div>
      </div>

      {/* BRANCH OVERVIEW */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={16} color="#3B82F6" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Integrasi Branch</h3>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Distribusi karyawan per kode cabang</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={thS}>Branch Code (BA)</th>
                <th style={thS}>Branch Name</th>
                <th style={thS}>Region</th>
                <th style={{ ...thS, textAlign: 'center' }}>Jumlah</th>
                <th style={{ ...thS, textAlign: 'center' }}>Proporsi</th>
              </tr>
            </thead>
            <tbody>
              {statsBranch.map((b: any, i: number) => {
                const pct = totalEmployees > 0 ? Math.round((b._count.ba / totalEmployees) * 100) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: 6, background: '#F1F5F9', fontSize: 13, fontWeight: 700, color: '#1E293B', fontFamily: 'monospace' }}>{b.ba}</span></td>
                    <td style={tdS}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} color="#94A3B8" /><span style={{ fontWeight: 600, color: '#1E293B' }}>{b.baCabang}</span></div></td>
                    <td style={tdS}><span style={{ fontSize: 13, color: '#64748B' }}>{b.region}</span></td>
                    <td style={{ ...tdS, textAlign: 'center' }}><span style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{b._count.ba}</span></td>
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 60, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: '#3B82F6', width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', minWidth: 30 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHARTS: DISTRIBUSI POSISI + SEBARAN CABANG */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Distribusi Posisi (dari kontrak terakhir saja) */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={14} color="#3B82F6" /></div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Distribusi Posisi</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Berdasarkan kontrak terakhir karyawan aktif</p>
            </div>
          </div>
          {statsPosisi.map(([posisi, count]) => (
            <div key={posisi} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{posisi}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{count}</span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #3B82F6, #60A5FA)', width: `${(count / maxPosisi) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sebaran Cabang (karyawan aktif) */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={14} color="#059669" /></div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', margin: 0 }}>Sebaran per Cabang</h3>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Karyawan aktif per lokasi</p>
            </div>
          </div>
          {statsCabang.map(([cabang, count], i) => {
            const colors = ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
            const pct = activeEmployees > 0 ? Math.round((count / activeEmployees) * 100) : 0;
            return (
              <div key={cabang} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < statsCabang.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', flex: 1 }}>{cabang}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{count}</span>
                <span style={{ fontSize: 12, color: '#94A3B8', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============ COMPONENTS ============ */

function GradientCard({ bg, icon, value, label, sub }: { bg: string; icon: React.ReactNode; value: number; label: string; sub: string }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: '20px 18px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -8, top: -8, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{sub}</span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color, sub, icon }: { label: string; value: number; color: string; sub: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F8FAFC' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{sub}</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

const thS: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', background: '#FAFBFC' };
const tdS: React.CSSProperties = { padding: '12px 16px', fontSize: 14, color: '#475569' };