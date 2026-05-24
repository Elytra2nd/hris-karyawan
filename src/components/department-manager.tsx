'use client'

import { useState } from 'react'
import { Buildings, Plus, Trash, CircleNotch, Users } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
import type { createDepartment, deleteDepartment, getDepartments } from '@/app/actions/department'

type Department = Awaited<ReturnType<typeof getDepartments>>[0]

interface Props {
  departments: Department[]
  createAction: typeof createDepartment
  deleteAction: typeof deleteDepartment
}

export function DepartmentManager({ departments: initial, createAction, deleteAction }: Props) {
  const [depts, setDepts] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (formData: FormData) => {
    setCreating(true)
    try {
      const result = await createAction(formData)
      if (result.success) {
        toast.success(result.message ?? 'Departemen dibuat')
        setShowForm(false)
        // Optimistic: refetch would be ideal but revalidatePath handles server side
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat departemen')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id)
    try {
      const result = await deleteAction(id)
      if (result.success) {
        toast.success(result.message ?? `${name} dihapus`)
        setDepts(prev => prev.filter(d => d.id !== id))
      } else {
        toast.error(result.error)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ─── Department List ─── */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Daftar Departemen
            <span className="ml-2 text-xs font-normal text-muted-foreground">({depts.length})</span>
          </h2>
          <Button size="sm" onClick={() => setShowForm(v => !v)} className="gap-1.5">
            <Plus size={13} />
            Tambah
          </Button>
        </div>

        {depts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Buildings size={36} className="opacity-20" />
            <p className="text-sm font-bold uppercase tracking-wider">Belum ada departemen</p>
            <p className="text-xs">Klik "Tambah" untuk membuat departemen pertama</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="th-standard text-left">Departemen</th>
                <th className="th-standard text-left">Kode</th>
                <th className="th-standard text-center">Karyawan</th>
                <th className="th-standard text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {depts.map(dept => (
                <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Buildings size={14} className="text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{dept.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {dept.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Users size={13} className="text-gray-400" />
                      {dept._count.employees}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <button
                              disabled={deleting === dept.id || dept._count.employees > 0}
                              className={cn(
                                'h-7 w-7 rounded-md flex items-center justify-center transition-colors mx-auto',
                                dept._count.employees > 0
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              )}
                            >
                              {deleting === dept.id
                                ? <CircleNotch size={13} className="animate-spin" />
                                : <Trash size={13} />}
                            </button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          {dept._count.employees > 0 ? 'Masih ada karyawan' : 'Hapus departemen'}
                        </TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Departemen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Departemen <strong>{dept.name}</strong> akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(dept.id, dept.name)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── Create Form ─── */}
      <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity', !showForm && 'opacity-50')}>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Tambah Departemen</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Buat departemen baru untuk organisasi</p>
        </div>
        <form action={handleCreate} className="p-5 space-y-4">
          <div className="space-y-2">
            <Label className="form-label">Nama Departemen <span className="text-red-500">*</span></Label>
            <Input name="name" nativeInput required placeholder="contoh: Penjualan & Distribusi" disabled={!showForm} />
          </div>
          <div className="space-y-2">
            <Label className="form-label">Kode <span className="text-red-500">*</span></Label>
            <Input
              name="code" nativeInput required placeholder="contoh: SALES"
              disabled={!showForm}
              className="uppercase font-mono"
              onChange={e => e.target.value = e.target.value.toUpperCase()}
            />
            <p className="text-[11px] text-slate-400">Huruf kapital, angka, dan strip saja</p>
          </div>
          <Button
            type="submit"
            disabled={creating || !showForm}
            className="w-full gap-1.5"
          >
            {creating
              ? <><CircleNotch size={13} className="animate-spin" /> Menyimpan...</>
              : <><Plus size={13} /> Buat Departemen</>}
          </Button>
        </form>
      </div>
    </div>
  )
}
