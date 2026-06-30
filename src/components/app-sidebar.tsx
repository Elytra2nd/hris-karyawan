'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  SquaresFour,
  Users,
  UserPlus,
  GearSix,
  Shield,
  ClipboardText,
  Buildings,
  MapPin,
  SignOut,
  UserGear,
  CaretDown,
  FileText,
} from '@phosphor-icons/react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarAdminOnly,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const [mounted, setMounted] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    karyawan: true,
    administrasi: true,
  })
  const { role, username } = useSidebar()
  const isAdmin       = role === 'ADMIN'
  const canManageHR   = ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role ?? '')
  const canReadAudit  = ['ADMIN', 'HR_MANAGER'].includes(role ?? '')
  const canManagePosition = ['ADMIN', 'HR_MANAGER'].includes(role ?? '')
  const pathname = usePathname()

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-sections') : null
    if (saved) {
      setOpenSections(JSON.parse(saved))
    }
    setMounted(true)
  }, [])

  const toggle = (key: string) => {
    setOpenSections(p => {
      const updated = { ...p, [key]: !p[key] }
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-sections', JSON.stringify(updated))
      }
      return updated
    })
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  if (!mounted) return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent />
    </Sidebar>
  )

  const initials = (username || 'U')[0].toUpperCase()

  return (
    <Sidebar>
      {/* ─── Header: Logo + App Name ─── */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/astra-motor.png"
            alt="Astra Motor"
            className="h-6 w-auto object-contain"
          />
          <div className="h-4 w-px bg-sidebar-border" />
          <div>
            <p className="text-sm font-bold text-foreground leading-snug">ATMS</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              Kalimantan Barat
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── Navigation ─── */}
      <SidebarContent className="px-4 py-4 overflow-y-auto space-y-6">

        {/* ── Umum ── */}
        <div>
          <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Umum
          </p>
          <nav className="space-y-0.5">
            <NavItem
              href="/"
              icon={<SquaresFour size={16} />}
              label="Dashboard"
              active={isActive('/')}
            />
          </nav>
        </div>

        {/* ── Trainee ── */}
        <div>
          <SectionHeader
            label="Trainee"
            open={openSections.karyawan}
            onToggle={() => toggle('karyawan')}
          />
          {openSections.karyawan && (
            <nav className="mt-1 space-y-0.5">
              <NavItem
                href="/karyawan"
                icon={<Users size={16} />}
                label="Data Trainee"
                active={isActive('/karyawan') && !pathname.includes('tambah')}
              />
              {canManageHR && (
                <NavItem
                  href="/karyawan/tambah"
                  icon={<UserPlus size={16} />}
                  label="Tambah Trainee"
                  active={isActive('/karyawan/tambah')}
                />
              )}
              <NavItem
                href="/kontrak"
                icon={<FileText size={16} />}
                label="Manajemen Kontrak"
                active={isActive('/kontrak')}
              />
            </nav>
          )}
        </div>

        {/* ── Administrasi (HR roles) ── */}
        <SidebarAdminOnly allowedRoles={['ADMIN', 'HR_MANAGER']}>
          <div>
            <SectionHeader
              label="Administrasi"
              open={openSections.administrasi}
              onToggle={() => toggle('administrasi')}
            />
            {openSections.administrasi && (
              <nav className="mt-1 space-y-0.5">
                {isAdmin && (
                  <>
                    <NavItem
                      href="/admin/users"
                      icon={<Shield size={16} />}
                      label="Manajemen Pengguna"
                      active={isActive('/admin/users')}
                    />
                    <NavItem
                      href="/admin/branches"
                      icon={<MapPin size={16} />}
                      label="Cabang"
                      active={isActive('/admin/branches')}
                    />
                  </>
                )}
                {canManagePosition && (
                  <NavItem
                    href="/admin/positions"
                    icon={<Buildings size={16} />}
                    label="Posisi"
                    active={isActive('/admin/positions')}
                  />
                )}
                {canReadAudit && (
                  <NavItem
                    href="/admin/audit-log"
                    icon={<ClipboardText size={16} />}
                    label="Log Aktivitas"
                    active={isActive('/admin/audit-log')}
                  />
                )}
                <NavItem
                  href="/admin/settings"
                  icon={<GearSix size={16} />}
                  label="Pengaturan"
                  active={isActive('/admin/settings')}
                />
              </nav>
            )}
          </div>
        </SidebarAdminOnly>

      </SidebarContent>

      {/* ─── Footer: User Info + Logout ─── */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-snug">
              {username || 'Pengguna'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {{ ADMIN: 'Administrator', HR_MANAGER: 'HR Manager', HR_STAFF: 'HR Staff', VIEWER: 'Pemirsa' }[role ?? ''] ?? role}
            </p>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                className="p-1.5 rounded-md text-muted-foreground/70 hover:text-primary hover:bg-accent transition-colors"
              >
                <UserGear size={16} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">Profil & Ganti Password</TooltipContent>
          </Tooltip>

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1.5 rounded-md text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <SignOut size={16} />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Keluar</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Keluar dari Sistem?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan keluar dari akun <strong>{username}</strong>. Sesi aktif akan dihentikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Ya, Keluar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className="mt-3 text-xs text-muted-foreground/70 text-center">
          Astra Trainee Monitoring System · v2.1
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground/80 transition-colors"
    >
      {label}
      <CaretDown
        size={12}
       
        className={cn(
          'text-muted-foreground/70 transition-transform duration-200',
          open ? 'rotate-0' : '-rotate-90'
        )}
      />
    </button>
  )
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors',
        active
          ? 'bg-accent text-primary font-semibold'
          : 'text-foreground/70 hover:bg-accent hover:text-primary font-medium'
      )}
    >
      <span className={cn('shrink-0', active ? 'text-primary' : 'text-muted-foreground/70')}>
        {icon}
      </span>
      {label}
    </Link>
  )
}
