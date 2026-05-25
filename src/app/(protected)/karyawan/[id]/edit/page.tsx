import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateEmployee } from '@/app/actions/employee'
import { getDepartments } from '@/app/actions/department'
import { EditKaryawanForm } from '@/components/edit-karyawan-form'
import { hasPermission } from '@/lib/auth-guard'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react/ssr'

export default async function EditKaryawanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (!hasPermission(session.role, 'employee_update')) redirect('/karyawan')

  const { id } = await params
  const [employee, departments] = await Promise.all([
    prisma.employee.findUnique({ where: { id }, include: { department: true } }),
    getDepartments(),
  ])
  if (!employee) notFound()

  const updateEmployeeWithId = updateEmployee.bind(null, id)

  return (
    <div className="space-y-5">
      <Link
        href={`/karyawan/${id}`}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors w-fit"
      >
        <CaretLeft size={16} />
        Kembali ke Detail Karyawan
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Karyawan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui data <span className="font-semibold text-foreground/80">{employee.namaLengkap}</span>
        </p>
      </div>

      <EditKaryawanForm employee={employee} updateAction={updateEmployeeWithId} departments={departments} />
    </div>
  )
}
