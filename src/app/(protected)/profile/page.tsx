import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { ChangePasswordForm } from '@/components/change-password-form'
import { Key, User, Shield, Calendar, IdentificationBadge, Clock } from '@phosphor-icons/react/ssr'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

const ROLE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  ADMIN: {
    label: 'Administrator',
    color: 'bg-red-500/10 text-red-600 border-red-200',
    description: 'Akses penuh — kelola pengguna, departemen, cabang, karyawan, dan log aktivitas',
  },
  HR_MANAGER: {
    label: 'HR Manager',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    description: 'Kelola data karyawan, kontrak, dan lihat log aktivitas',
  },
  HR_STAFF: {
    label: 'HR Staff',
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    description: 'Input dan edit data karyawan serta kontrak',
  },
  VIEWER: {
    label: 'Pemirsa',
    color: 'bg-gray-500/10 text-gray-600 border-gray-200',
    description: 'Hanya bisa melihat data karyawan (baca saja)',
  },
}

export default async function ProfilePage() {
  const session = await verifySession()

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { createdAt: true },
  })

  const roleInfo = ROLE_LABELS[session.role] ?? {
    label: session.role,
    color: 'bg-muted text-foreground/70 border-border',
    description: '-',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil Akun</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola informasi dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ─── Account Info Card (Left) ─── */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 flex items-center gap-4 border-b border-border/60">
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl shrink-0">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{session.username}</p>
              <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${roleInfo.color}`}>
                <Shield size={10} weight="bold" />
                {roleInfo.label}
              </span>
            </div>
          </div>

          <div className="divide-y divide-border/60">
            {/* Role Description */}
            <div className="px-6 py-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <IdentificationBadge size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hak Akses</p>
                <p className="text-sm text-foreground mt-0.5">{roleInfo.description}</p>
              </div>
            </div>

            {/* Created At */}
            {user?.createdAt && (
              <div className="px-6 py-3.5 flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Calendar size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Akun Dibuat</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {format(user.createdAt, 'dd MMMM yyyy, HH:mm', { locale: localeID })} WIB
                  </p>
                </div>
              </div>
            )}

            {/* Session Info */}
            <div className="px-6 py-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <Clock size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durasi Sesi</p>
                <p className="text-sm text-foreground mt-0.5">Otomatis keluar setelah 8 jam tidak aktif</p>
              </div>
            </div>

            {/* User ID */}
            <div className="px-6 py-3.5 flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID Pengguna</p>
                <p className="text-sm text-foreground/60 font-mono mt-0.5 break-all">{session.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Change Password Card (Right) ─── */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
              <Key size={16} className="text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Ganti Password</h2>
          </div>
          <div className="p-5">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  )
}

