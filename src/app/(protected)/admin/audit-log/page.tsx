import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal';
import { format } from 'date-fns';
import { History, PlusCircle, Pencil, Trash2, Clock, Activity } from 'lucide-react';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function AuditLogPage() {
  await verifySession();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const createCount = logs.filter(l => l.action === 'CREATE').length;
  const updateCount = logs.filter(l => l.action === 'UPDATE').length;
  const deleteCount = logs.filter(l => l.action === 'DELETE').length;

  const actionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <PlusCircle size={14} color="#059669" />;
      case 'UPDATE': return <Pencil size={14} color="#3B82F6" />;
      case 'DELETE': return <Trash2 size={14} color="#DC2626" />;
      default: return <Activity size={14} color="#94A3B8" />;
    }
  };

  const actionBadge = (action: string) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
      'CREATE': { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
      'UPDATE': { bg: '#EFF6FF', color: '#3B82F6', border: '#BFDBFE' },
      'DELETE': { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
    };
    const s = styles[action] || { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
        {actionIcon(action)} {action}
      </span>
    );
  };

  return (
    <div style={{ fontFamily: F }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>Log Aktivitas</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Riwayat perubahan data sistem HRIS</p>
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} />
          Menampilkan 100 log terakhir
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={<History size={18} color="#3B82F6" />} bg="#EFF6FF" value={logs.length} label="Total Log" />
        <StatCard icon={<PlusCircle size={18} color="#059669" />} bg="#ECFDF5" value={createCount} label="Create" />
        <StatCard icon={<Pencil size={18} color="#3B82F6" />} bg="#EFF6FF" value={updateCount} label="Update" />
        <StatCard icon={<Trash2 size={18} color="#DC2626" />} bg="#FEF2F2" value={deleteCount} label="Delete" />
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <th style={thS}>Waktu</th>
              <th style={thS}>User</th>
              <th style={{ ...thS, textAlign: 'center' }}>Aksi</th>
              <th style={thS}>Entity</th>
              <th style={thS}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: 13 }}>Belum ada log aktivitas.</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={tdS}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>
                      {format(new Date(log.createdAt), 'dd MMM yyyy')}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {format(new Date(log.createdAt), 'HH:mm:ss')}
                    </div>
                  </div>
                </td>
                <td style={tdS}>
                  <span style={{ fontWeight: 600, color: '#1E293B', fontSize: 13 }}>
                    {log.userName}
                  </span>
                </td>
                <td style={{ ...tdS, textAlign: 'center' }}>{actionBadge(log.action)}</td>
                <td style={tdS}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{log.entity}</span>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{log.entityId.substring(0, 12)}...</div>
                  </div>
                </td>
                <td style={tdS}>
                  <span style={{ fontSize: 12, color: '#94A3B8', maxWidth: 300, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details || '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: number; label: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>{value}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

const thS: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', background: '#FAFBFC' };
const tdS: React.CSSProperties = { padding: '12px 16px', fontSize: 14, color: '#475569' };