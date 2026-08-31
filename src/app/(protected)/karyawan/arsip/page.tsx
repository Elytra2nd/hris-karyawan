import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/permissions'
import { getArchivedEmployees, getDistinctCabang } from '@/app/actions/employee'
import { Archive, ArrowLeft } from '@phosphor-icons/react/ssr'
import { EmptyState } from '@/components/ui/empty-state'
import { ArchiveActions } from '@/components/archive-actions'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'

export default async function ArsipPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const session = await verifySession()
  // Hanya peran yang boleh menghapus (arsip) yang boleh mengakses.
  if (!hasPermission(session.role, 'employee_delete')) redirect('/karyawan')

  const canHardDelete = hasPermission(session.role, 'user_manage') // ADMIN
  const cabang = (await searchParams).cabang ?? ''
  const [archived, cabangOptions] = await Promise.all([
    getArchivedEmployees({ cabang }),
    getDistinctCabang(),
  ])

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

      {/* Filter cabang — form GET biasa: halaman ini server component tanpa
          client JS, jadi tak perlu menambah komponen klien hanya untuk satu
          select. Opsinya dari master cabang, sama dgn halaman lain. */}
      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="cabang" className="text-xs font-medium text-muted-foreground">
            Cabang
          </label>
          <select
            id="cabang"
            name="cabang"
            defaultValue={cabang}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="">Semua cabang</option>
            {cabangOptions.map(c => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Terapkan
        </button>
        {cabang && (
          <Link
            href="/karyawan/arsip"
            className="h-9 inline-flex items-center rounded-lg border border-border px-3 text-sm text-muted-foreground hover:bg-muted"
          >
            Reset
          </Link>
        )}
      </form>

      {archived.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={cabang ? 'Tidak ada arsip di cabang ini' : 'Arsip kosong'}
          description={
            cabang
              ? 'Coba pilih cabang lain atau reset filter.'
              : 'Belum ada trainee yang diarsipkan. Data yang Anda hapus dari daftar akan muncul di sini.'
          }
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
