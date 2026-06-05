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
  SignOut,
  UserGear,
  CaretDown,
  CalendarBlank,
  Clock,
  AirplaneTilt,
  Money,
  Receipt,
  HandCoins,
  Target,
  Star,
  ChatCircleText,
  Lock,
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

  useEffect(() => {
    // Load persisted section state from localStorage
    const saved = typeof window !== 'undefined' ? localStorage.getItem('sidebar-sections') : null
    if (saved) {
      setOpenSections(JSON.parse(saved))
    }
    setMounted(true)
  }, [])

  const toggle = (key: string) => {
    setOpenSections(p => {
      const updated = { ...p, [key]: !p[key] }
      // Persist to localStorage
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
      {/* ─── Header: Module Switcher + Logo ─── */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 space-y-3">
        {/* Module Switcher */}
        <div className="flex items-center gap-1.5">
          <button className="px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground">
            HRIS
          </button>
          <button
            disabled
            className="px-3 py-1 text-xs font-medium rounded-md text-muted-foreground/70 border border-border cursor-not-allowed"
            title="Segera hadir"
          >
            ATS
          </button>
        </div>

        {/* Logo & App Name */}
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/astra-motor.png"
            alt="Astra Motor"
            className="h-6 w-auto object-contain"
          />
          <div className="h-4 w-px bg-sidebar-border" />
          <div>
            <p className="text-sm font-bold text-foreground leading-none">HRIS</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              Kalimantan Barat
            </p>
          </div>
        </div>
      </SidebarHeader>

      {/* ─── Navigation ─── */}
      <SidebarContent className="px-3 py-4 overflow-y-auto space-y-5">

        {/* ── Umum ── */}
        <div>
          <p className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
            Umum
          </p>
          <nav className="space-y-0.5">
            <NavItem
              href="/"
              icon={<SquaresFour size={16} weight="duotone" />}
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
                icon={<Users size={16} weight="duotone" />}
                label="Data Karyawan"
                active={isActive('/karyawan') && !pathname.includes('tambah')}
              />
              {canManageHR && (
                <NavItem
                  href="/karyawan/tambah"
                  icon={<UserPlus size={16} weight="duotone" />}
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
                      icon={<Shield size={16} weight="duotone" />}
                      label="Manajemen Pengguna"
                      active={isActive('/admin/users')}
                    />
                    <NavItem
                      href="/admin/departments"
                      icon={<Buildings size={16} weight="duotone" />}
                      label="Departemen"
                      active={isActive('/admin/departments')}
                    />
                  </>
                )}
                {canReadAudit && (
                  <NavItem
                    href="/admin/audit-log"
                    icon={<ClipboardText size={16} weight="duotone" />}
                    label="Log Aktivitas"
                    active={isActive('/admin/audit-log')}
                  />
                )}
                <NavItem
                  href="/admin/settings"
                  icon={<GearSix size={16} weight="duotone" />}
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
            <NavItemDisabled icon={<CalendarBlank size={16} />} label="Jadwal & Shift" />
            <NavItemDisabled icon={<AirplaneTilt size={16} />} label="Cuti" />
            <NavItemDisabled icon={<Clock size={16} />} label="Lembur" />
          </nav>
        </div>

        {/* ── Keuangan — Coming Soon ── */}
        <div>
          <SectionHeaderDisabled label="Keuangan" comingSoon="Q4 2026" />
          <nav className="mt-1 space-y-0.5 opacity-50 pointer-events-none">
            <NavItemDisabled icon={<Money size={16} />} label="Penggajian" />
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
            <NavItemDisabled icon={<ChatCircleText size={16} />} label="Umpan Balik" />
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
            <p className="text-sm font-semibold text-foreground truncate leading-none">
              {username || 'Pengguna'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">
              {{ ADMIN: 'Administrator', HR_MANAGER: 'HR Manager', HR_STAFF: 'HR Staff', VIEWER: 'Pemirsa' }[role ?? ''] ?? role}
            </p>
          </div>

          {/* Profil */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/profile"
                className="p-1.5 rounded-md text-muted-foreground/70 hover:text-primary hover:bg-accent transition-colors"
              >
                <UserGear size={15} weight="duotone" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top">
              Profil & Ganti Password
            </TooltipContent>
          </Tooltip>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-1.5 rounded-md text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <SignOut size={15} weight="bold" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Keluar
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Branding */}
        <p className="mt-3 text-[10px] text-muted-foreground/70 text-center">
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
      className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground/80 transition-colors"
    >
      {label}
      <CaretDown
        size={13}
        weight="bold"
        className={cn(
          'text-muted-foreground/70 transition-transform duration-200',
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
      <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-[9px] font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded uppercase tracking-wide">
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
          : 'text-foreground/70 hover:bg-accent hover:text-primary font-medium'
      )}
    >
      <span
        className={cn(
          'shrink-0',
          active ? 'text-primary' : 'text-muted-foreground/70'
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
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground/70 font-medium cursor-not-allowed">
      <span className="shrink-0 text-muted-foreground/50">
        <Lock size={14} />
      </span>
      {label}
    </div>
  )
}
