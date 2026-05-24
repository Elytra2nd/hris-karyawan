import { verifySession } from '@/lib/dal'
import { createEmployee } from '@/app/actions/employee'
import { getDepartments } from '@/app/actions/department'
import { CaretLeft } from '@phosphor-icons/react/ssr'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { EmployeeForm } from '@/components/employee-form'
import { hasPermission } from '@/lib/auth-guard'

export default async function TambahKaryawanPage() {
  const session = await verifySession()
  if (!hasPermission(session.role, 'employee_create')) redirect('/karyawan')

  const departments = await getDepartments()

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <Link
        href="/karyawan"
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors w-fit"
      >
        <CaretLeft size={16} />
        Kembali ke Data Karyawan
      </Link>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Karyawan Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Input identitas diri dan masa kontrak awal sesuai aturan jabatan.
        </p>
      </div>

      {/* Form container */}
      <div className="max-w-xl bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <EmployeeForm action={createEmployee} departments={departments} />
      </div>
    </div>
  )
}
