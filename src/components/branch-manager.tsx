'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Trash, CircleNotch, Users, MagnifyingGlass, Pencil, Check, X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { branchSchema } from '@/lib/validation'
import type { createBranch, deleteBranch, updateBranch, getBranches } from '@/app/actions/branch'

type Branch = Awaited<ReturnType<typeof getBranches>>[0]

interface Props {
  branches: Branch[]
  createAction: typeof createBranch
  deleteAction: typeof deleteBranch
  updateAction: typeof updateBranch
}

export function BranchManager({ branches: initial, createAction, deleteAction, updateAction }: Props) {
  const router = useRouter()
  const [branches, setBranches] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editCode, setEditCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(
    () => !search ? branches : branches.filter(b =>
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase())
    ),
    [branches, search]
  )

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const raw = {
      code: formData.get('code')?.toString().trim().toUpperCase() ?? '',
      label: formData.get('label')?.toString().trim().toUpperCase() ?? '',
    }

    const parsed = branchSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach(e => {
        const field = e.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = e.message
      })
      setCreateErrors(fieldErrors)
      toast.error('Ada isian yang belum sesuai - lihat kolom yang ditandai merah')
      const firstField = parsed.error.issues[0]?.path[0]
      if (firstField) document.getElementById(`branch-${String(firstField)}`)?.focus()
      return
    }

    setCreateErrors({})
    setCreating(true)
    try {
      // Kirim sebagai plain object (menghindari OpenLiteSpeed multipart bug)
      const result = await createAction({ code: raw.code, label: raw.label })
      if (result.success) {
        toast.success(result.message ?? 'Cabang dibuat')
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

  const startEdit = (branch: Branch) => {
    setEditing(branch.id)
    setEditLabel(branch.label)
    setEditCode(branch.code)
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditLabel('')
    setEditCode('')
  }

  const handleSaveEdit = async (id: string) => {
    const parsed = branchSchema.safeParse({ code: editCode.trim().toUpperCase(), label: editLabel.trim().toUpperCase() })
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Ada isian yang belum sesuai')
      return
    }

    setSaving(true)
    try {
      // Kirim sebagai plain object (menghindari OpenLiteSpeed multipart bug)
      const result = await updateAction(id, { code: editCode.trim().toUpperCase(), label: editLabel.trim().toUpperCase() })
      if (result.success) {
        toast.success(result.message ?? 'Cabang diperbarui')
        setBranches(prev => prev.map(b => b.id === id ? { ...b, label: editLabel.toUpperCase(), code: editCode.toUpperCase() } : b))
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

  const handleDelete = async (id: string, label: string) => {
    setDeleting(id)
    try {
      const result = await deleteAction(id)
      if (result.success) {
        toast.success(result.message ?? `${label} dihapus`)
        setBranches(prev => prev.filter(b => b.id !== id))
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

      {/* ─── Branch List ─── */}
      <div className="lg:col-span-2 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-2 sm:py-4 border-b border-border/60 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground">
              Cabang
              <span className="ml-2 text-xs font-normal text-muted-foreground">({branches.length})</span>
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
              placeholder="Cari kode atau nama cabang..."
              aria-label="Cari cabang"
              className="w-full h-8 pl-8 pr-3 text-base sm:text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground/70"
            />
          </div>
        </div>

        {branches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
            <MapPin size={36} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-wider">Belum ada cabang</p>
            <p className="text-xs">Klik &quot;Tambah&quot; untuk membuat cabang pertama</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="th-standard text-left">Kode</th>
                <th className="th-standard text-left">Nama Cabang</th>
                <th className="th-standard text-center">Trainee</th>
                <th className="th-standard text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 && search && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Tidak ada cabang untuk &ldquo;{search}&rdquo;
                  </td>
                </tr>
              )}
              {filtered.map(branch => (
                <tr key={branch.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3.5">
                    {editing === branch.id ? (
                      <input
                        value={editCode}
                        onChange={e => setEditCode(e.target.value.toUpperCase())}
                        className="w-24 h-8 px-2 text-base sm:text-sm font-mono border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono text-xs font-bold bg-muted text-foreground/80 px-2 py-1 rounded">
                        {branch.code}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {editing === branch.id ? (
                      <input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="w-full h-8 px-2 text-base sm:text-sm border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                          <MapPin size={16} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{branch.label}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-foreground/70">
                      <Users size={12} className="text-muted-foreground/70" />
                      {branch._count.employees}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      {editing === branch.id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(branch.id)}
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
                                onClick={() => startEdit(branch)}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-primary hover:bg-accent transition-colors"
                              >
                                <Pencil size={12} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Edit cabang</TooltipContent>
                          </Tooltip>
                          <AlertDialog>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <button
                                    disabled={deleting === branch.id || branch._count.employees > 0}
                                    className={cn(
                                      'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
                                      branch._count.employees > 0
                                        ? 'text-muted-foreground/50 cursor-not-allowed'
                                        : 'text-muted-foreground/70 hover:text-red-600 hover:bg-red-50'
                                    )}
                                  >
                                    {deleting === branch.id
                                      ? <CircleNotch size={12} className="animate-spin" />
                                      : <Trash size={12} />}
                                  </button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                {branch._count.employees > 0 ? 'Masih ada karyawan' : 'Hapus cabang'}
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Cabang?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cabang <strong>{branch.label}</strong> ({branch.code}) akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(branch.id, branch.label)}
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

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-border/60">
              {filtered.length === 0 && search && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Tidak ada cabang untuk &ldquo;{search}&rdquo;
                </div>
              )}
              {filtered.map(branch => (
                <div key={branch.id} className="px-4 py-3.5">
                  {editing === branch.id ? (
                    <div className="space-y-2">
                      <input
                        value={editCode}
                        onChange={e => setEditCode(e.target.value.toUpperCase())}
                        className="w-24 h-8 px-2 text-base sm:text-sm font-mono border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                        autoFocus
                        placeholder="KODE"
                      />
                      <input
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        className="w-full h-8 px-2 text-base sm:text-sm border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Nama cabang"
                      />
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(branch.id)}
                          disabled={saving}
                          className="h-8 px-4 rounded-md text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="h-8 px-4 rounded-md text-xs font-semibold border border-border hover:bg-muted/50 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                          <MapPin size={16} className="text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{branch.label}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs font-bold bg-muted text-foreground/80 px-1.5 py-0.5 rounded">{branch.code}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users size={12} /> {branch._count.employees}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(branch)}
                          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-primary hover:bg-accent transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        {branch._count.employees === 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                disabled={deleting === branch.id}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground/70 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {deleting === branch.id
                                  ? <CircleNotch size={16} className="animate-spin" />
                                  : <Trash size={16} />}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Cabang?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cabang <strong>{branch.label}</strong> ({branch.code}) akan dihapus permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(branch.id, branch.label)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Create Form ─── */}
      <div className={cn('bg-card border border-border rounded-lg shadow-sm overflow-hidden transition-opacity', !showForm && 'opacity-50')}>
        <div className="px-5 py-4 border-b border-border/60">
          <h2 className="text-base font-bold text-foreground">Tambah Cabang</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Buat cabang baru untuk organisasi</p>
        </div>
        <form onSubmit={handleCreate} noValidate className="p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-code" className="form-label">Kode Cabang <span className="text-red-500">*</span></Label>
            <Input
              id="branch-code"
              name="code"
              nativeInput
              required
              placeholder="contoh: H731"
              disabled={!showForm}
              aria-invalid={!!createErrors.code}
              aria-describedby={createErrors.code ? 'branch-code-error' : 'branch-code-hint'}
              className={`uppercase font-mono ${createErrors.code ? 'border-destructive' : ''}`}
              onChange={e => e.target.value = e.target.value.toUpperCase()}
            />
            <FieldError id="branch-code-error" message={createErrors.code} />
            {!createErrors.code && <p id="branch-code-hint" className="text-xs text-muted-foreground/70">Huruf kapital, angka, dan strip saja</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-label" className="form-label">Nama Cabang <span className="text-red-500">*</span></Label>
            <Input
              id="branch-label"
              name="label"
              nativeInput
              required
              placeholder="contoh: MEMPAWAH"
              disabled={!showForm}
              aria-invalid={!!createErrors.label}
              aria-describedby={createErrors.label ? 'branch-label-error' : undefined}
              className={createErrors.label ? 'border-destructive' : ''}
            />
            <FieldError id="branch-label-error" message={createErrors.label} />
          </div>
          <Button
            type="submit"
            disabled={creating || !showForm}
            className="w-full gap-1.5"
          >
            {creating
              ? <><CircleNotch size={12} className="animate-spin" /> Menyimpan...</>
              : <><Plus size={12} /> Buat Cabang</>}
          </Button>
        </form>
      </div>
    </div>
  )
}
