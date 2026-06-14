'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import {
  SquaresFour,
  Users,
  UserPlus,
  GearSix,
  ClipboardText,
  Buildings,
  MapPin,
  MagnifyingGlassMinusIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  action: () => void
}

export function CommandPalette({ isAdmin, canManageHR }: { isAdmin: boolean; canManageHR: boolean }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Define commands based on user role
  const commands: Command[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Kembali ke halaman utama',
      icon: <SquaresFour size={16} />,
      action: () => router.push('/'),
    },
    {
      id: 'employees',
      title: 'Data Karyawan',
      description: 'Lihat daftar semua karyawan',
      icon: <Users size={16} />,
      action: () => router.push('/karyawan'),
    },
    ...(canManageHR ? [{
      id: 'add-employee',
      title: 'Tambah Karyawan',
      description: 'Buat data karyawan baru',
      icon: <UserPlus size={16} />,
      action: () => router.push('/karyawan/tambah'),
    }] : []),
    ...(isAdmin ? [
      {
        id: 'manage-users',
        title: 'Manajemen Pengguna',
        description: 'Kelola pengguna sistem',
        icon: <Users size={16} />,
        action: () => router.push('/admin/users'),
      },
      {
        id: 'departments',
        title: 'Departemen',
        description: 'Kelola departemen organisasi',
        icon: <Buildings size={16} />,
        action: () => router.push('/admin/departments'),
      },
      {
        id: 'branches',
        title: 'Cabang',
        description: 'Kelola cabang organisasi',
        icon: <MapPin size={16} />,
        action: () => router.push('/admin/branches'),
      },
      {
        id: 'audit-log',
        title: 'Log Aktivitas',
        description: 'Lihat riwayat perubahan sistem',
        icon: <ClipboardText size={16} />,
        action: () => router.push('/admin/audit-log'),
      },
      {
        id: 'settings',
        title: 'Pengaturan',
        description: 'Konfigurasi sistem',
        icon: <GearSix size={16} />,
        action: () => router.push('/admin/settings'),
      },
    ] : []),
  ]

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
        setSearch('')
        setSelectedIndex(0)
      }

      // Handle navigation when open
      if (open) {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault()
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
            break
          case 'ArrowUp':
            e.preventDefault()
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
            break
          case 'Enter':
            e.preventDefault()
            if (filteredCommands[selectedIndex]) {
              filteredCommands[selectedIndex].action()
              setOpen(false)
            }
            break
          case 'Escape':
            e.preventDefault()
            setOpen(false)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, search, filteredCommands, selectedIndex])

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
        <div className="w-full max-w-lg pointer-events-auto">
          <div className="bg-popover text-popover-foreground rounded-lg shadow-lg border border-border overflow-hidden">
            {/* Search Input */}
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-2">
                <MagnifyingGlassMinusIcon size={16} className="text-muted-foreground" />
                <Input
                  placeholder="Cari command..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="border-0 p-0 text-sm focus-visible:ring-0"
                  autoFocus
                  nativeInput
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-2">
                <span>Gunakan</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
                <span>untuk navigasi,</span>
                <kbd className="px-2 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
                <span>untuk pilih</span>
              </p>
            </div>

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredCommands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                  <MagnifyingGlassMinusIcon size={24} className="opacity-30" />
                  <p className="text-sm font-bold">Tidak ada perintah yang cocok</p>
                </div>
              ) : (
                filteredCommands.map((cmd, index) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action()
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full px-4 py-2 flex items-center gap-4 text-left transition-colors border-b border-border last:border-0',
                      selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                    )}
                  >
                    <div className="text-muted-foreground flex-shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {cmd.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {cmd.description}
                      </p>
                    </div>
                    {selectedIndex === index && (
                      <div className="text-xs font-mono text-muted-foreground flex-shrink-0">
                        ↵
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-2 bg-muted/50">
              <p className="text-[11px] text-muted-foreground text-center">
                Tekan <kbd className="px-1.5 py-0.5 bg-card rounded text-[10px] font-mono border border-border inline-block">Esc</kbd> untuk menutup
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
