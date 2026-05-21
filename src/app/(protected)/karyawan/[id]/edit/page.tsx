import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateEmployee } from '@/app/actions/employee'
import { EditKaryawanForm } from '@/components/edit-karyawan-form'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function EditKaryawanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await verifySession()
  if (session?.role !== 'ADMIN') redirect('/karyawan')

  const { id } = await params
  const employee = await prisma.employee.findUnique({ where: { id } })
  if (!employee) notFound()

  const updateEmployeeWithId = updateEmployee.bind(null, id)

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        href={`/karyawan/${id}`}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors w-fit"
      >
        <ChevronLeft size={16} />
        Kembali ke Detail Karyawan
      </Link>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Karyawan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perbarui data <span className="font-semibold text-gray-700">{employee.namaLengkap}</span>
        </p>
      </div>

      <EditKaryawanForm employee={employee} updateAction={updateEmployeeWithId} />
    </div>
  )
}
