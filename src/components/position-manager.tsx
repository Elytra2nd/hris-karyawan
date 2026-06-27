'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Buildings, Plus, Trash, CircleNotch, ClockCounterClockwise, MagnifyingGlass, Pencil, Check, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { positionSchema } from '@/lib/validation'
import type { createPosition, deletePosition, updatePosition, getPositions } from '@/app/actions/position'

type Position = Awaited<ReturnType<typeof getPositions>>[0]

interface Props {
  positions: Position[]
  createAction: typeof createPosition
  deleteAction: typeof deletePosition
  updateAction: typeof updatePosition
}

export function PositionManager({ positions: initial, createAction, deleteAction, updateAction }: Props) {
  const router = useRouter()
  const [positions, setPositions] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editMonths, setEditMonths] = useState('6')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(
    () => !search ? positions : positions.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [positions, search]
  )

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const raw = {
      name: formData.get('name')?.toString().trim().toUpperCase() ?? '',
      contractMonths: formData.get('contractMonths')?.toString() ?? '',
    }

    const parsed = positionSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach(err => {
        const field = err.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setCreateErrors(fieldErrors)
      toast.error('Ada isian yang belum sesuai - lihat kolom yang ditandai merah')
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) document.getElementById(`position-${String(firstField)}`)?.focus()
      return
    }

    setCreateErrors({})
    setCreating(true)
    try {
      // Kirim sebagai plain object (menghindari OpenLiteSpeed multipart bug)
      const result = await createAction({ name: raw.name, contractMonths: raw.contractMonths })
      if (result.success) {
        toast.success(result.message ?? 'Posisi dibuat')
        setShowForm(false)
        setCreateErrors({})
        router.refresh()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba kirim ulang')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (pos: Position) => {
    setEditing(pos.id)
    setEditName(pos.name)
    setEditMonths(String(pos.contractMonths))
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditName('')
    setEditMonths('6')
  }

  const handleSaveEdit = async (id: string) => {
    const parsed = positionSchema.safeParse({ name: editName.trim().toUpperCase(), contractMonths: editMonths })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ada isian yang belum sesuai')
      return
    }

    setSaving(true)
    try {
      const result = await updateAction(id, { name: editName.trim().toUpperCase(), contractMonths: editMonths })
      if (result.success) {
        toast.success(result.message ?? 'Posisi diperbarui')
        setPositions(prev => prev.map(p => p.id === id ? { ...p, name: editName.toUpperCase(), contractMonths: parsed.data.contractMonths } : p))
        cancelEdit()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba simpan ulang')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    try {
      const result = await deleteAction(id)
      if (result.success) {
        toast.success(result.message ?? `${name} dihapus`)
        setPositions(prev => prev.filter(p => p.id !== id))
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Koneksi terputus - coba ulangi')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ─── Position List ─── */}
      <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-2 sm:py-4 border-b border-border/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground">
              Posisi
              <span className="ml-2 text-xs font-normal text-muted-foreground">({positions.length})</span>
            </h2>
            <Button size="sm" onClick={() => setShowForm(v => !v)} className="gap-2 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus size={12} />
              <span className="hidden sm:inline">Tambah</span>
              <span className="sm:hidden">+</span>
            </Button>
          </div>
          <div className="relative">
            <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama posisi..."
              aria-label="Cari posisi"
              className="w-full h-8 pl-8 pr-3 text-base sm:text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <Buildings size={36} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-wider">Belum ada posisi</p>
            <p className="text-xs">Klik &quot;Tambah&quot; untuk membuat posisi pertama</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="th-standard text-left">Nama Posisi</th>
                  <th className="th-standard text-center">Durasi Kontrak</th>
                  <th className="th-standard text-center">Dipakai</th>
                  <th className="th-standard text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.length === 0 && search && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Tidak ada posisi untuk &ldquo;{search}&rdquo;
                    </td>
                  </tr>
                )}
                {filtered.map(pos => (
                  <tr key={pos.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3.5">
                      {editing === pos.id ? (
                        <input
                          value={editName}
                          onChange={e => setEditName(e.target.value.toUpperCase())}
                          className="w-full h-8 px-2 text-base sm:text-sm border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Buildings size={16} className="text-primary" />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{pos.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {editing === pos.id ? (
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={editMonths}
                          onChange={e => setEditMonths(e.target.value)}
                          className="w-20 h-8 px-2 text-base sm:text-sm border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 text-center"
                        />
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <ClockCounterClockwise size={12} /> {pos.contractMonths} bln
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-foreground/70">
                      {pos._count.contracts} kontrak
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1">
                        {editing === pos.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(pos.id)}
                              disabled={saving}
                              className="h-8 w-8 rounded-md flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors"
                              title="Simpan"
                              aria-label="Simpan perubahan"
                            >
                              {saving ? <CircleNotch size={12} className="animate-spin" /> : <Check size={12} />}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground/70 hover:bg-muted/50 transition-colors"
                              title="Batal"
                              aria-label="Batal edit"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => startEdit(pos)}
                                  className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-primary hover:bg-accent transition-colors"
                                >
                                  <Pencil size={12} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Edit posisi</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <button
                                      disabled={deleting === pos.id || pos._count.contracts > 0}
                                      className={cn(
                                        'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                                        pos._count.contracts > 0
                                          ? 'text-muted-foreground/50 cursor-not-allowed'
                                          : 'text-muted-foreground/70 hover:text-red-600 hover:bg-red-50'
                                      )}
                                    >
                                      {deleting === pos.id
                                        ? <CircleNotch size={12} className="animate-spin" />
                                        : <Trash size={12} />}
                                    </button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {pos._count.contracts > 0 ? 'Masih dipakai kontrak' : 'Hapus posisi'}
                                </TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Posisi?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Posisi <strong>{pos.name}</strong> akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(pos.id, pos.name)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create Form ─── */}
      <div className={cn('bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-opacity', !showForm && 'opacity-50')}>
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="text-base font-bold text-foreground">Tambah Posisi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Buat posisi / jabatan baru</p>
        </div>
        <form onSubmit={handleCreate} noValidate className="p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="position-name" className="form-label">Nama Posisi <span className="text-red-500">*</span></Label>
            <Input
              id="position-name"
              name="name"
              nativeInput
              required
              placeholder="contoh: SALES EXECUTIVE"
              disabled={!showForm}
              aria-invalid={!!createErrors.name}
              aria-describedby={createErrors.name ? 'position-name-error' : undefined}
              className={`uppercase ${createErrors.name ? 'border-destructive' : ''}`}
              onChange={e => e.target.value = e.target.value.toUpperCase()}
            />
            <FieldError id="position-name-error" message={createErrors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-contractMonths" className="form-label">Durasi Kontrak (bulan) <span className="text-red-500">*</span></Label>
            <Input
              id="position-contractMonths"
              name="contractMonths"
              nativeInput
              required
              type="number"
              min={1}
              max={24}
              defaultValue={6}
              placeholder="contoh: 6"
              disabled={!showForm}
              aria-invalid={!!createErrors.contractMonths}
              aria-describedby={createErrors.contractMonths ? 'position-contractMonths-error' : 'position-contractMonths-hint'}
              className={createErrors.contractMonths ? 'border-destructive' : ''}
            />
            <FieldError id="position-contractMonths-error" message={createErrors.contractMonths} />
            {!createErrors.contractMonths && <p id="position-contractMonths-hint" className="text-xs text-muted-foreground/70">Tanggal akhir kontrak dihitung otomatis dari durasi ini.</p>}
          </div>
          <Button type="submit" disabled={creating || !showForm} className="w-full gap-1.5">
            {creating
              ? <><CircleNotch size={12} className="animate-spin" /> Menyimpan...</>
              : <><Plus size={12} /> Buat Posisi</>}
          </Button>
        </form>
      </div>
    </div>
  )
}
