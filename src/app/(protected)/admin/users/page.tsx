import { getUsers } from '@/app/actions/user'
import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { ShieldCheck, Shield, Users, Clock, Info } from '@phosphor-icons/react/ssr'
import { CreateUserModal } from '@/components/create-user-modal'
import { DeleteUserButton } from '@/components/delete-user-button'
import { ResetPasswordButton } from '@/components/reset-password-button'
import { EditRoleButton } from '@/components/edit-role-button'
import { EmptyState } from '@/components/ui/empty-state'
import { UserFilters } from './user-filters'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ADMIN:      { label: 'Admin',      cls: 'bg-amber-100 text-amber-700' },
    HR_MANAGER: { label: 'HR Manager', cls: 'bg-accent text-primary' },
    HR_STAFF:   { label: 'HR Staff',   cls: 'bg-green-100 text-green-700' },
    VIEWER:     { label: 'Pemirsa',    cls: 'bg-muted text-foreground/70' },
  }
  const { label, cls } = map[role] ?? { label: role, cls: 'bg-muted text-foreground/70' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>
      <Shield size={12} />
      {label}
    </span>
  )
}

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/karyawan')

  const { q = '', role: roleFilter = '' } = await searchParams
  const allUsers = await getUsers()
  const currentUserId = session.id

  const users = allUsers.filter(u => {
    const matchQ = !q || u.username.toLowerCase().includes(q.toLowerCase())
    const matchRole = !roleFilter || u.role === roleFilter
    return matchQ && matchRole
  })

  const adminCount  = allUsers.filter(u => u.role === 'ADMIN').length
  const hrCount     = allUsers.filter(u => u.role === 'HR_MANAGER' || u.role === 'HR_STAFF').length
  const viewerCount = allUsers.filter(u => u.role === 'VIEWER').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola akses pengguna sistem ATMS
          </p>
        </div>
        <CreateUserModal />
      </div>

      {/* ─── Stat Cards (clickable drill-down) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/users" className="bg-primary rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-card/20 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white leading-snug">{allUsers.length}</p>
            <p className="text-xs text-blue-100 mt-1">Total Pengguna</p>
          </div>
        </Link>

        <Link href="/admin/users?role=ADMIN" className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-snug">{adminCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Administrator</p>
          </div>
        </Link>

        <Link href="/admin/users?role=VIEWER" className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground leading-snug">{viewerCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Pemirsa</p>
          </div>
        </Link>
      </div>

      {/* ─── Info Banner ─── */}
      <div className="flex items-start gap-2 rounded-md bg-accent border border-primary/20 px-4 py-2">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/80">
          <strong>Admin</strong> punya akses penuh.{' '}
          <strong>HR Manager</strong> bisa CRUD karyawan.{' '}
          <strong>HR Staff</strong> bisa tambah & edit.{' '}
          <strong>Pemirsa</strong> hanya bisa lihat data.
        </p>
      </div>

      {/* ─── Search + Filter ─── */}
      <UserFilters q={q} role={roleFilter} />

      {/* ─── Table Desktop ─── */}
      <div className="hidden md:block bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b border-border bg-accent/60">
                <th className="px-5 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Pengguna</th>
                <th className="px-5 py-2 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">Role</th>
                <th className="px-5 py-2 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wider">Dibuat</th>
                <th className="px-5 py-2 text-center text-xs font-semibold text-foreground/80 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {users.length === 0 ? (
                <EmptyState
                  asTableRow
                  colSpan={4}
                  icon={Users}
                  title={q || roleFilter ? 'Tidak ada pengguna ditemukan' : 'Belum ada pengguna'}
                  description={q || roleFilter ? 'Coba ubah filter pencarian' : 'Buat akun pertama untuk Admin, HR, atau Pemirsa sistem'}
                />
              ) : (
                users.map((user, i) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border text-sm font-bold ${
                          user.role === 'ADMIN'      ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          user.role === 'HR_MANAGER' ? 'bg-accent border-primary/20 text-primary' :
                          user.role === 'HR_STAFF'   ? 'bg-green-50 border-green-200 text-green-700' :
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
                    <td className="px-5 py-4 text-center">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                        <Clock size={12} className="text-muted-foreground/70 shrink-0" />
                        {user.createdAt
                          ? format(new Date(user.createdAt), 'dd MMM yyyy', { locale: localeID })
                          : '-'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <EditRoleButton id={user.id} username={user.username} currentRole={user.role} />
                        <ResetPasswordButton id={user.id} username={user.username} />
                        <DeleteUserButton id={user.id} username={user.username} isSelf={user.id === currentUserId} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2 border-t border-border/60 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {users.length} dari {allUsers.length} pengguna · {adminCount} admin · {hrCount} HR · {viewerCount} pemirsa
          </p>
        </div>
      </div>

      {/* ─── Card View Mobile ─── */}
      <div className="md:hidden bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {q || roleFilter ? 'Tidak ada pengguna ditemukan' : 'Belum ada pengguna'}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {users.map((user) => (
              <div key={user.id} className="px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border text-sm font-bold ${
                    user.role === 'ADMIN'      ? 'bg-amber-50 border-amber-200 text-amber-700' :
                    user.role === 'HR_MANAGER' ? 'bg-accent border-primary/20 text-primary' :
                    user.role === 'HR_STAFF'   ? 'bg-green-50 border-green-200 text-green-700' :
                                                 'bg-muted/50 border-border text-muted-foreground'
                  }`}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <RoleBadge role={user.role} />
                      {user.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: localeID })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <EditRoleButton id={user.id} username={user.username} currentRole={user.role} />
                  <ResetPasswordButton id={user.id} username={user.username} />
                  <DeleteUserButton id={user.id} username={user.username} isSelf={user.id === currentUserId} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-2 border-t border-border/60 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {users.length} dari {allUsers.length} pengguna
          </p>
        </div>
      </div>
    </div>
  )
}
