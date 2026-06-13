import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { ChangePasswordForm } from '@/components/change-password-form'
import {
  GearSix, Key, Shield, Info, User,
} from '@phosphor-icons/react/ssr'

export default async function SettingsPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/karyawan')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola pengaturan akun dan keamanan sistem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ─── Profil Akun ─── */}
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
            <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Profil Akun</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-black text-xl shrink-0">
                {session.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{session.username}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  session.role === 'ADMIN'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-muted text-foreground/70'
                }`}>
                  <Shield size={12} className="inline-block mr-1 -mt-0.5" />
                  {session.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/60">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Username</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{session.username}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Role</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {{ ADMIN: 'Administrator', HR_MANAGER: 'HR Manager', HR_STAFF: 'HR Staff', VIEWER: 'Pemirsa' }[session.role] ?? session.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Ganti Password ─── */}
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

      {/* ─── Info Sistem ─── */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
          <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center">
            <GearSix size={16} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Informasi Sistem</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 px-4 py-2 rounded-lg bg-muted/50 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">Aplikasi</p>
              <p className="text-sm font-bold text-foreground">Trainee Monitoring System</p>
            </div>
            <div className="flex flex-col gap-1 px-4 py-2 rounded-lg bg-muted/50 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">Versi</p>
              <p className="text-sm font-bold text-foreground">v2.1.0</p>
            </div>
            <div className="flex flex-col gap-1 px-4 py-2 rounded-lg bg-muted/50 border border-border/60">
              <p className="text-xs text-muted-foreground font-medium">Platform</p>
              <p className="text-sm font-bold text-foreground">Next.js + Prisma</p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md bg-accent border border-primary/20 px-4 py-2 mt-4">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">
              Sistem ini dikelola oleh tim IT Astra Motor Kalimantan Barat.
              Hubungi administrator jika memerlukan bantuan teknis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
