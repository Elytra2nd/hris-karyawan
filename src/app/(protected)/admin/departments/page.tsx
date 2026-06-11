import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { getDepartments, createDepartment, deleteDepartment, updateDepartment } from '@/app/actions/department'
import { DepartmentManager } from '@/components/department-manager'
import { Buildings } from '@phosphor-icons/react/ssr'

export default async function DepartmentsPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/karyawan')

  const departments = await getDepartments()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Buildings size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Departemen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola struktur departemen organisasi
          </p>
        </div>
      </div>

      <DepartmentManager
        departments={departments}
        createAction={createDepartment}
        deleteAction={deleteDepartment}
        updateAction={updateDepartment}
      />
    </div>
  )
}
