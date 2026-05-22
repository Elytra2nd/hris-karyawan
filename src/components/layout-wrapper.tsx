'use client'

import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Separator } from '@/components/ui/separator'
import { NotificationBell } from '@/components/notification-bell'

export default function LayoutWrapper({
  children,
  role,
  username,
}: {
  children: React.ReactNode
  role?: string
  username?: string
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  return (
    <TooltipProvider>
      {isLoginPage ? (
        <main className="min-h-screen w-full">
          {children}
        </main>
      ) : (
        <SidebarProvider role={role} username={username}>
          <AppSidebar />

          <SidebarInset className="flex flex-col min-h-svh bg-gray-50/50 overflow-x-hidden">
            {/* ─── Top Header ─── */}
            <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 bg-white border-b border-gray-200 px-4">
              {/* Hamburger untuk mobile */}
              <SidebarTrigger className="-ml-1 text-gray-500 hover:text-primary" />
              <Separator orientation="vertical" className="h-4 mx-1" />
              <span className="text-xs text-muted-foreground hidden sm:block flex-1">
                HRIS Karyawan Trainee
              </span>

              {/* ─── Right-side header actions ─── */}
              <div className="ml-auto flex items-center gap-1">
                <NotificationBell />
              </div>
            </header>

            {/* ─── Page Content ─── */}
            <main className="flex-1 p-6 w-full max-w-[1400px] mx-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="top-center" richColors closeButton />
    </TooltipProvider>
  )
}
