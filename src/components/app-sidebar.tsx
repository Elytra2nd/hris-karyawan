'use client';

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText,
  History,
  ShieldCheck,
  UserCog // Icon untuk Management User
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarAdminOnly,
} from "@/components/ui/sidebar"
import Link from "next/link"
import LogoutButton from "./logout-button"
import { ExportExcelButton } from "./export-excel-button"

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skeleton / Loading State
  if (!mounted) {
    return (
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-700 tracking-tighter">
            <FileText className="w-6 h-6" />
            <span>HRIS KARYAWAN</span>
          </div>
        </SidebarHeader>
        <SidebarContent />
      </Sidebar>
    );
  }

  return (
    <Sidebar className="font-sans">
      <SidebarHeader className="p-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-black text-xl text-blue-700 tracking-tighter">
          <FileText className="w-6 h-6 text-blue-600" />
          <span>HRIS KARYAWAN</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white/30">
        {/* GROUP 1: MENU GENERAL (Semua Role) */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" className="hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Link href="/" className="flex items-center gap-3 py-2">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Data Karyawan" className="hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <Link href="/karyawan" className="flex items-center gap-3 py-2">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Data Karyawan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <div className="px-0 py-1">
                  <ExportExcelButton variant="sidebar" />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GROUP 2: MENU ADMINISTRATOR (Hanya Admin) */}
        <SidebarAdminOnly>
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" /> Administrator Area
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="px-2">
                {/* Menu Tambah Karyawan */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Tambah Karyawan" className="hover:bg-amber-50 hover:text-amber-700 transition-colors">
                    <Link href="/karyawan/tambah" className="flex items-center gap-3 py-2">
                      <UserPlus className="w-5 h-5" />
                      <span className="font-medium">Tambah Karyawan</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Menu Management User - BARU */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Manage Users" className="hover:bg-amber-50 hover:text-amber-700 transition-colors">
                    <Link href="/admin/users" className="flex items-center gap-3 py-2">
                      <UserCog className="w-5 h-5" />
                      <span className="font-medium">Management User</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Menu Log Aktivitas */}
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Log Aktivitas" className="hover:bg-slate-100 hover:text-slate-900 transition-colors">
                    <Link href="/admin/audit-log" className="flex items-center gap-3 py-2">
                      <History className="w-5 h-5" />
                      <span className="font-medium">Log Aktivitas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarAdminOnly>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-slate-50/50">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}