import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import { getArchivedEmployees } from '@/app/actions/employee'
import { Archive, ArrowLeft } from '@phosphor-icons/react/ssr'
import { EmptyState } from '@/components/ui/empty-state'
import { ArchiveActions } from '@/components/archive-actions'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function ArsipPage() {
  const session = await verifySession()
  // Hanya peran yang boleh menghapus (arsip) yang boleh mengakses.
  if (!hasPermission(session.role, 'employee_delete')) redirect('/karyawan')

  const canHardDelete = hasPermission(session.role, 'user_manage') // ADMIN
  const archived = await getArchivedEmployees()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/karyawan"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft size={16} />
          Kembali ke Data Karyawan
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <Archive size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Arsip Trainee</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Data yang diarsipkan masih tersimpan lengkap dan bisa dipulihkan kapan saja.
            </p>
          </div>
        </div>
      </div>

      {archived.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Arsip kosong"
          description="Belum ada trainee yang diarsipkan. Data yang Anda hapus dari daftar akan muncul di sini."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs font-semibold text-muted-foreground">
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">No. KTP</th>
                  <th className="px-4 py-3">Cabang</th>
                  <th className="px-4 py-3">Diarsipkan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {archived.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{e.namaLengkap}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{e.noKtp}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.cabang}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.deletedAt ? format(new Date(e.deletedAt), 'd MMM yyyy, HH:mm', { locale: localeID }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <ArchiveActions id={e.id} name={e.namaLengkap} canHardDelete={canHardDelete} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {archived.map((e) => (
              <div key={e.id} className="rounded-xl border border-border p-4 space-y-3">
                <div>
                  <p className="font-semibold text-foreground">{e.namaLengkap}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{e.noKtp} · {e.cabang}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Diarsipkan {e.deletedAt ? format(new Date(e.deletedAt), 'd MMM yyyy', { locale: localeID }) : '-'}
                  </p>
                </div>
                <ArchiveActions id={e.id} name={e.namaLengkap} canHardDelete={canHardDelete} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
