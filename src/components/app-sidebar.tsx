'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, UserPlus, FileSpreadsheet,
  History, UserCog, ChevronDown, Search, Settings,
  HelpCircle, Link2, LogOut, User,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarAdminOnly, useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { signOut } from 'next-auth/react';
import { ExportExcelButton } from "./export-excel-button";

const F = "'Satoshi', 'Inter', system-ui, sans-serif";

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ employee: true, admin: true });
  const { role, username } = useSidebar();
  const isAdmin = role === 'ADMIN';
  const pathname = usePathname();
  useEffect(() => { setMounted(true); }, []);

  const toggle = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  if (!mounted) return <Sidebar><SidebarHeader /><SidebarContent /></Sidebar>;

  return (
    <Sidebar style={{ fontFamily: F }}>
      {/* ===== LOGO ===== */}
      <SidebarHeader style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/astra-logo.png" alt="Astra" style={{ height: 22, objectFit: 'contain' }} />
            <div style={{ width: 1, height: 18, background: '#E2E8F0' }} />
            <span style={{ fontWeight: 700, fontSize: 12, color: '#64748B', letterSpacing: '0.02em' }}>HRIS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent style={{ padding: 0, backgroundColor: '#fff', flex: 1, overflowY: 'auto' }}>
        {/* SEARCH */}
        <div style={{ padding: '12px 12px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, color: '#94A3B8' }}>
            <Search size={14} />
            <span>Search...</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
              <kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 10, color: '#94A3B8', background: '#F8FAFC' }}>⌘</kbd>
              <kbd style={{ padding: '1px 5px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 10, color: '#94A3B8', background: '#F8FAFC' }}>F</kbd>
            </div>
          </div>
        </div>

        {/* ===== BEST PRACTICE SIDEBAR ORDER ===== */}
        {/* 1. Dashboard (overview first) */}
        <div style={{ padding: '4px 8px' }}>
          <NavItem href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={active('/')} />
        </div>

        {/* 2. Employee Data (core feature) */}
        <Section title="Karyawan" icon={<Users size={15} />} open={openSections.employee} onToggle={() => toggle('employee')}>
          <SubItem href="/karyawan" label="Data Karyawan" active={active('/karyawan') && !pathname.includes('tambah')} />
          {isAdmin && <SubItem href="/karyawan/tambah" label="Tambah Karyawan" active={active('/karyawan/tambah')} />}
        </Section>

        {/* 3. Admin Section */}
        <SidebarAdminOnly>
          <Section title="Administrasi" icon={<Settings size={15} />} open={openSections.admin} onToggle={() => toggle('admin')}>
            <SubItem href="/admin/users" label="Management User" active={active('/admin/users')} />
            <SubItem href="/admin/audit-log" label="Log Aktivitas" active={active('/admin/audit-log')} />
            <div style={{ padding: '2px 0' }}>
              <ExportExcelButton variant="sidebar" />
            </div>
          </Section>
        </SidebarAdminOnly>
      </SidebarContent>

      {/* ===== USER FOOTER ===== */}
      <SidebarFooter style={{ padding: '12px', borderTop: '1px solid #F1F5F9' }}>
        <button onClick={() => signOut({ callbackUrl: '/login' })} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 8px',
          borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
            {(username || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{username || 'User'}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{role || 'VIEWER'}</div>
          </div>
          <LogOut size={14} color="#DC2626" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

/* ============ REUSABLE COMPONENTS ============ */

function Section({ title, icon, open, onToggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ padding: '4px 8px' }}>
      <button onClick={onToggle} style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 8px',
        borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, color: '#475569', textAlign: 'left',
      }}>
        <span style={{ display: 'flex', color: '#94A3B8' }}>{icon}</span>
        {title}
        <ChevronDown size={14} color="#94A3B8" style={{ marginLeft: 'auto', transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
      </button>
      {open && <div style={{ paddingLeft: 4 }}>{children}</div>}
    </div>
  );
}

function NavItem({ href, icon, label, active: isActive }: {
  href: string; icon: React.ReactNode; label: string; active: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px', borderRadius: 8, marginBottom: 1,
        fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? '#1E293B' : '#64748B',
        backgroundColor: isActive ? '#F1F5F9' : 'transparent', transition: 'all 0.15s', cursor: 'pointer',
      }}>
        <span style={{ display: 'flex', color: isActive ? '#1E293B' : '#94A3B8' }}>{icon}</span>
        {label}
      </div>
    </Link>
  );
}

function SubItem({ href, label, active: isActive }: { href: string; label: string; active: boolean; }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '6px 8px 6px 36px', fontSize: 13, borderRadius: 6, marginBottom: 1,
        fontWeight: isActive ? 700 : 400, color: isActive ? '#1E293B' : '#64748B',
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
        {label}
      </div>
    </Link>
  );
}