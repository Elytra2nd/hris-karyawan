import { getUsers } from '@/app/actions/user'
import { ShieldCheck, Shield, Users, Clock, PulseIcon, Info } from '@phosphor-icons/react/ssr'
import { CreateUserModal } from '@/components/create-user-modal'
import { DeleteUserButton } from '@/components/delete-user-button'
import { ResetPasswordButton } from '@/components/reset-password-button'
import { EmptyState } from '@/components/ui/empty-state'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ADMIN:      { label: 'Admin',      cls: 'bg-amber-100 text-amber-700' },
    HR_MANAGER: { label: 'HR Manager', cls: 'bg-blue-100 text-blue-700' },
    HR_STAFF:   { label: 'HR Staff',   cls: 'bg-green-100 text-green-700' },
    VIEWER:     { label: 'Pemirsa',    cls: 'bg-muted text-foreground/70' },
  }
  const { label, cls } = map[role] ?? { label: role, cls: 'bg-muted text-foreground/70' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Shield size={11} />
      {label}
    </span>
  )
}

export default async function UserManagementPage() {
  const users = await getUsers()
  const adminCount   = users.filter(u => u.role === 'ADMIN').length
  const hrCount      = users.filter(u => u.role === 'HR_MANAGER' || u.role === 'HR_STAFF').length
  const viewerCount  = users.filter(u => u.role === 'VIEWER').length

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola akses pengguna sistem HRIS
          </p>
        </div>
        <CreateUserModal />
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-primary rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-card/20 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-none">{users.length}</p>
            <p className="text-xs text-blue-100 mt-1">Total Pengguna</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{adminCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Administrator</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{viewerCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pemirsa</p>
          </div>
        </div>
      </div>

      {/* ─── Info Banner ─── */}
      <div className="flex items-start gap-2.5 rounded-md bg-accent border border-blue-100 px-4 py-3">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <strong>Admin</strong> dapat menambah, edit, dan hapus data karyawan.{' '}
          <strong>Pemirsa</strong> hanya dapat melihat data tanpa bisa melakukan perubahan.
        </p>
      </div>

      {/* ─── Table ─── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                Pengguna
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                Dibuat
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider w-16">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {users.length === 0 ? (
              <EmptyState
                asTableRow
                colSpan={4}
                icon={Users}
                title="Belum ada pengguna"
                description="Buat akun pertama untuk Admin, HR, atau Pemirsa sistem"
              />
            ) : (
              users.map((user, i) => (
                <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                  {/* User info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border text-sm font-bold ${
                        user.role === 'ADMIN'         ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        user.role === 'HR_MANAGER'    ? 'bg-accent border-blue-200 text-blue-700' :
                        user.role === 'HR_STAFF'      ? 'bg-green-50 border-green-200 text-green-700' :
                                                        'bg-muted/50 border-border text-muted-foreground'
                      }`}>
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">Pengguna #{i + 1}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role chip */}
                  <td className="px-5 py-4 text-center">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Dibuat */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                      <Clock size={12} className="text-muted-foreground/70 shrink-0" />
                      {user.createdAt
                        ? format(new Date(user.createdAt), 'dd MMM yyyy', { locale: localeID })
                        : '—'}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <ResetPasswordButton id={user.id} username={user.username} />
                      <DeleteUserButton id={user.id} username={user.username} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/60 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {users.length} pengguna terdaftar · {adminCount} admin · {hrCount} HR · {viewerCount} pemirsa
          </p>
        </div>
      </div>
    </div>
  )
}
