import { getUsers } from '@/app/actions/user';
import { ShieldCheck, Shield, User, Users, Clock, Activity } from "lucide-react";
import { CreateUserModal } from "@/components/create-user-modal";
import { DeleteUserButton } from "@/components/delete-user-button";
import { format } from 'date-fns';

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export default async function UserManagementPage() {
  const users = await getUsers();
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const viewerCount = users.filter(u => u.role === 'VIEWER').length;

  return (
    <div style={{ fontFamily: F }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', margin: 0 }}>Management User</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Kelola akses pengguna sistem HRIS</p>
        </div>
        <CreateUserModal />
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#3B82F6" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>{users.length}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Total User</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="#D97706" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>{adminCount}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Administrator</div>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={20} color="#64748B" />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>{viewerCount}</div>
            <div style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Viewer</div>
          </div>
        </div>
      </div>

      {/* INFO */}
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={16} color="#3B82F6" />
        <span><strong>Admin</strong> dapat menambah, edit, dan hapus data karyawan. <strong>Viewer</strong> hanya dapat melihat data.</span>
      </div>

      {/* TABLE */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              <th style={thS}>Username</th>
              <th style={{ ...thS, textAlign: 'center' }}>Role</th>
              <th style={thS}>Dibuat</th>
              <th style={{ ...thS, textAlign: 'center', width: 80 }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: user.role === 'ADMIN' ? '#FFFBEB' : '#F1F5F9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${user.role === 'ADMIN' ? '#FDE68A' : '#E2E8F0'}`,
                    }}>
                      <User size={16} color={user.role === 'ADMIN' ? '#D97706' : '#94A3B8'} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 14 }}>{user.username}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>User #{i + 1}</div>
                    </div>
                  </div>
                </td>
                <td style={{ ...tdS, textAlign: 'center' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: user.role === 'ADMIN' ? '#FFFBEB' : '#F1F5F9',
                    color: user.role === 'ADMIN' ? '#D97706' : '#64748B',
                    border: `1px solid ${user.role === 'ADMIN' ? '#FDE68A' : '#E2E8F0'}`,
                  }}>
                    {user.role === 'ADMIN' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                    {user.role}
                  </span>
                </td>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B' }}>
                    <Clock size={12} color="#94A3B8" />
                    {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy') : '-'}
                  </div>
                </td>
                <td style={{ ...tdS, textAlign: 'center' }}>
                  <DeleteUserButton id={user.id} username={user.username} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thS: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748B', background: '#FAFBFC' };
const tdS: React.CSSProperties = { padding: '12px 16px', fontSize: 14, color: '#475569' };