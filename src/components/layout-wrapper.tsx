'use client'

import { usePathname } from 'next/navigation'
import { IconContext } from '@phosphor-icons/react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Separator } from '@/components/ui/separator'
import { NotificationBell } from '@/components/notification-bell'
import { BreadcrumbTrail } from '@/components/breadcrumb-trail'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'

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
    <IconContext.Provider value={{ weight: 'light' }}>
    <TooltipProvider>
      {isLoginPage ? (
        <main className="min-h-screen w-full">
          {children}
        </main>
      ) : (
        <SidebarProvider role={role} username={username}>
          {/* WCAG 2.4.1 — Skip navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
          >
            Langsung ke konten utama
          </a>
          <AppSidebar />

          <SidebarInset className="flex flex-col min-h-svh bg-background overflow-x-hidden">
            {/* ─── Top Header ─── */}
            <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 bg-card border-b border-border px-4">
              {/* Hamburger untuk mobile */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-primary" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  Buka Menu
                </TooltipContent>
              </Tooltip>
              <Separator orientation="vertical" className="h-4 mx-2" />
              <span className="text-xs text-muted-foreground hidden sm:block flex-1">
                Trainee Monitoring System
              </span>

              {/* ─── Right-side header actions ─── */}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <NotificationBell />
              </div>
            </header>

            {/* ─── Breadcrumb Trail ─── */}
            <BreadcrumbTrail />

            {/* ─── Page Content ─── */}
            <main id="main-content" className="flex-1 p-4 md:p-8 w-full max-w-[1400px] mx-auto">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      )}
      <Toaster position="top-center" richColors closeButton />
      <CommandPalette
        isAdmin={role === 'ADMIN'}
        canManageHR={['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role ?? '')}
      />
    </TooltipProvider>
    </IconContext.Provider>
  )
}
