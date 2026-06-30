'use client'

import React from 'react'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbLabel {
  label: string
  href?: string
}

const LABEL_MAP: Record<string, string> = {
  karyawan: 'Data Trainee',
  tambah: 'Tambah Trainee',
  edit: 'Edit Trainee',
  kontrak: 'Manajemen Kontrak',
  admin: 'Administrasi',
  users: 'Manajemen Pengguna',
  positions: 'Posisi',
  branches: 'Cabang',
  'audit-log': 'Log Aktivitas',
  settings: 'Pengaturan',
  profile: 'Profil',
}

// Detect CUID-style IDs (e.g. cmnlk0inx000ubcqeszepskkc)
function looksLikeDynamicId(segment: string): boolean {
  return /^[a-z0-9]{20,}$/i.test(segment)
}

function getBreadcrumbs(pathname: string): BreadcrumbLabel[] {
  const segments = pathname.split('/').filter(Boolean)

  // Skip if on root or login
  if (segments.length === 0 || pathname === '/login') {
    return []
  }

  const breadcrumbs: BreadcrumbLabel[] = [{ label: 'Dashboard', href: '/' }]
  let currentPath = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const isDynamic = looksLikeDynamicId(segment)

    if (isDynamic) {
      // For dynamic segments, show generic label based on parent
      currentPath += `/${segment}`
      const parentSegment = segments[i - 1]

      if (parentSegment === 'karyawan') {
        const isLastSegment = i === segments.length - 1

        if (isLastSegment) {
          breadcrumbs.push({ label: 'Detail Trainee' })
        } else {
          breadcrumbs.push({ label: 'Detail Trainee', href: currentPath })
        }
      }
    } else {
      // Regular segment
      currentPath += `/${segment}`
      const label = LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isLastSegment = i === segments.length - 1

      if (isLastSegment) {
        breadcrumbs.push({ label })
      } else {
        breadcrumbs.push({ label, href: currentPath })
      }
    }
  }

  return breadcrumbs
}

export function BreadcrumbTrail() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  // Don't show breadcrumbs on login page or root
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <Breadcrumb className="px-4 md:px-8 py-2 border-b border-border bg-muted/30">
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.label}-${index}`}>
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="text-foreground/70 hover:text-primary">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-foreground font-medium">
                  {crumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {crumb.href && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
