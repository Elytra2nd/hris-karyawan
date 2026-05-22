'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  Shield,
  ClipboardList,
  Building2,
  LogOut,
  UserCog,
  ChevronDown,
  CalendarDays,
  Clock,
  Plane,
  Banknote,
  Receipt,
  HandCoins,
  Target,
  Star,
  MessageSquare,
  Lock,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarAdminOnly,
  useSidebar,
} from '@/components/ui/sidebar'
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
  const canManageData = ['ADMIN', 'HR_MANAGER'].includes(role ?? '')
  const canReadAudit  = ['ADMIN', 'HR_MANAGER'].includes(role ?? '')
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])

  const toggle = (key: string) =>
    setOpenSections(p => ({ ...p, [key]: !p[key] }))

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
      {/* ─── Header: Module Switcher + Logo ─── */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 space-y-3">
        {/* Module Switcher */}
        <div className="flex items-center gap-1.5">
          <button className="px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground">
            HRIS
          </button>
          <button
            disabled
            className="px-3 py-1 text-xs font-medium rounded-md text-gray-400 border border-gray-200 cursor-not-allowed"
            title="Segera hadir"
          >
            ATS
          </button>
        </div>

        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/astra-logo.png"
            alt="Astra Motor Kalbar"
            className="h-6 object-contain"
          />
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">HRIS</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Astra Motor Kalbar
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── Navigation ─── */}
      <SidebarContent className="px-3 py-4 overflow-y-auto space-y-5">

        {/* ── Umum ── */}
        <div>
          <p className="px-2 mb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Umum
          </p>
          <nav className="space-y-0.5">
            <NavItem
              href="/"
              icon={<LayoutDashboard size={16} />}
              label="Dashboard"
              active={isActive('/')}
            />
          </nav>
        </div>

        {/* ── Karyawan ── */}
        <div>
          <SectionHeader
            label="Karyawan"
            open={openSections.karyawan}
            onToggle={() => toggle('karyawan')}
          />
          {openSections.karyawan && (
            <nav className="mt-1 space-y-0.5">
              <NavItem
                href="/karyawan"
                icon={<Users size={16} />}
                label="Data Karyawan"
                active={isActive('/karyawan') && !pathname.includes('tambah')}
              />
              {canManageHR && (
                <NavItem
                  href="/karyawan/tambah"
                  icon={<UserPlus size={16} />}
                  label="Tambah Karyawan"
                  active={isActive('/karyawan/tambah')}
                />
              )}
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
                      href="/admin/departments"
                      icon={<Building2 size={16} />}
                      label="Departemen"
                      active={isActive('/admin/departments')}
                    />
                  </>
                )}
                {canReadAudit && (
                  <NavItem
                    href="/admin/audit-log"
                    icon={<ClipboardList size={16} />}
                    label="Log Aktivitas"
                    active={isActive('/admin/audit-log')}
                  />
                )}
                <NavItem
                  href="/admin/settings"
                  icon={<Settings size={16} />}
                  label="Pengaturan"
                  active={isActive('/admin/settings')}
                />
              </nav>
            )}
          </div>
        </SidebarAdminOnly>

        {/* ── Waktu — Coming Soon ── */}
        <div>
          <SectionHeaderDisabled label="Waktu" comingSoon="Q3 2026" />
          <nav className="mt-1 space-y-0.5 opacity-50 pointer-events-none">
            <NavItemDisabled icon={<CalendarDays size={16} />} label="Jadwal & Shift" />
            <NavItemDisabled icon={<Plane size={16} />} label="Cuti" />
            <NavItemDisabled icon={<Clock size={16} />} label="Lembur" />
          </nav>
        </div>

        {/* ── Keuangan — Coming Soon ── */}
        <div>
          <SectionHeaderDisabled label="Keuangan" comingSoon="Q4 2026" />
          <nav className="mt-1 space-y-0.5 opacity-50 pointer-events-none">
            <NavItemDisabled icon={<Banknote size={16} />} label="Penggajian" />
            <NavItemDisabled icon={<Receipt size={16} />} label="Reimbursement" />
            <NavItemDisabled icon={<HandCoins size={16} />} label="Kasbon" />
          </nav>
        </div>

        {/* ── Kinerja — Coming Soon ── */}
        <div>
          <SectionHeaderDisabled label="Kinerja" comingSoon="2027" />
          <nav className="mt-1 space-y-0.5 opacity-50 pointer-events-none">
            <NavItemDisabled icon={<Target size={16} />} label="KPI & OKR" />
            <NavItemDisabled icon={<Star size={16} />} label="Penilaian Kinerja" />
            <NavItemDisabled icon={<MessageSquare size={16} />} label="Umpan Balik" />
          </nav>
        </div>

      </SidebarContent>

      {/* ─── Footer: User Info + Logout ─── */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-none">
              {username || 'Pengguna'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
              {{ ADMIN: 'Administrator', HR_MANAGER: 'HR Manager', HR_STAFF: 'HR Staff', VIEWER: 'Pemirsa' }[role ?? ''] ?? role}
            </p>
          </div>

          {/* Profil */}
          <Link
            href="/profile"
            className="p-1.5 rounded-md text-gray-400 hover:text-primary hover:bg-blue-50 transition-colors"
            title="Profil & Ganti Password"
          >
            <UserCog size={15} />
          </Link>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Keluar"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Branding */}
        <p className="mt-3 text-[10px] text-gray-400 text-center">
          HRIS Karyawan Trainee · v1.0
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
      className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
    >
      {label}
      <ChevronDown
        size={13}
        className={cn(
          'text-gray-400 transition-transform duration-200',
          open ? 'rotate-0' : '-rotate-90'
        )}
      />
    </button>
  )
}

function SectionHeaderDisabled({
  label,
  comingSoon,
}: {
  label: string
  comingSoon: string
}) {
  return (
    <div className="flex items-center justify-between w-full px-2 py-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
        {comingSoon}
      </span>
    </div>
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
        'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors',
        active
          ? 'bg-accent text-primary font-semibold'
          : 'text-gray-600 hover:bg-accent hover:text-primary font-medium'
      )}
    >
      <span
        className={cn(
          'shrink-0',
          active ? 'text-primary' : 'text-gray-400'
        )}
      >
        {icon}
      </span>
      {label}
    </Link>
  )
}

function NavItemDisabled({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-gray-400 font-medium cursor-not-allowed">
      <span className="shrink-0 text-gray-300">
        <Lock size={14} />
      </span>
      {label}
    </div>
  )
}
