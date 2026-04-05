'use client'; // Pastikan ada directive ini

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
} from "@/components/ui/sidebar"
import Link from "next/link"
import LogoutButton from "./logout-button"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Data Karyawan", url: "/", icon: Users },
  { title: "Tambah Karyawan", url: "/karyawan/tambah", icon: UserPlus },
]

export function AppSidebar() {
  // Solusi Hydration: Cek apakah komponen sudah mounted di browser
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Jika belum mounted, tampilkan sidebar kosong/statik sederhana 
  // agar tidak ada perbedaan HTML dengan server
  if (!mounted) {
    return (
      <Sidebar>
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-700">
            <FileText className="w-6 h-6" />
            <span>HRIS KARYAWAN</span>
          </div>
        </SidebarHeader>
        <SidebarContent />
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-xl text-blue-700">
          <FileText className="w-6 h-6" />
          <span>HRIS KARYAWAN</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4 border-t">
        <LogoutButton />
      </div>
    </Sidebar>
  )
}