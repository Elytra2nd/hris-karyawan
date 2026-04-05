'use client';

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText 
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
  SidebarFooter, // Menggunakan SidebarFooter bawaan untuk posisi bawah
} from "@/components/ui/sidebar"
import Link from "next/link"
import LogoutButton from "./logout-button"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Data Karyawan", url: "/", icon: Users },
  { title: "Tambah Karyawan", url: "/karyawan/tambah", icon: UserPlus },
]

export function AppSidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <Sidebar className="font-sans"> {/* Memastikan font Poppins aktif di sidebar */}
      <SidebarHeader className="p-4 border-b bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-black text-xl text-blue-700 tracking-tighter">
          <FileText className="w-6 h-6 text-blue-600" />
          <span>HRIS KARYAWAN</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-white/30">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Menu Utama
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-blue-50 hover:text-blue-700 transition-colors">
                    <Link href={item.url} className="flex items-center gap-3 py-2">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Sidebar untuk Logout dengan Konfirmasi */}
      <SidebarFooter className="p-4 border-t bg-slate-50/50">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}