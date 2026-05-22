import { verifySession } from '@/lib/dal'
import { ChangePasswordForm } from '@/components/change-password-form'
import { KeyRound, User } from 'lucide-react'

export default async function ProfilePage() {
  const session = await verifySession()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Akun</h1>
        <p className="text-sm text-muted-foreground mt-1">Kelola informasi dan keamanan akun Anda</p>
      </div>

      {/* Account info card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-lg shrink-0">
          {session.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-900">{session.username}</p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
            session.role === 'ADMIN'
              ? 'bg-primary/10 text-primary'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {session.role}
          </span>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center">
            <KeyRound size={14} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-gray-800">Ganti Password</h2>
        </div>
        <div className="p-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
