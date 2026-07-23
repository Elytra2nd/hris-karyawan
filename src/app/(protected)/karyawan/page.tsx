import { getEmployees, getEmployeeStats, getDistinctCabang } from '@/app/actions/employee'
import { KaryawanClient, PER_PAGE } from './karyawan-client'

// Server Component: ambil data awal di server (first paint langsung berisi,
// tanpa flash skeleton), lalu serahkan interaktivitas ke KaryawanClient.
export default async function KaryawanPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const sp = await searchParams
  const search = sp.search ?? ''
  const cabang = sp.cabang ?? ''
  const status = sp.status ?? ''
  const contractFilter = sp.filter ?? ''
  const posisi = sp.posisi ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))
  // Sort dibaca dari URL juga — dulu hanya dipakai jalur fetch di client,
  // sehingga hasil render server (dan reload halaman) selalu tak terurut.
  const sortBy = sp.sort ?? ''
  const sortDir = sp.dir === 'desc' ? 'desc' : 'asc'

  const [data, stats, cabangOptions] = await Promise.all([
    getEmployees({ search, cabang, status, contractFilter, posisi, page, perPage: PER_PAGE, sortBy, sortDir }),
    getEmployeeStats({ search, cabang, posisi }),
    getDistinctCabang(),
  ])

  return (
    <KaryawanClient
      initial={{
        employees: data.employees,
        total: data.total,
        loadError: data.loadError,
        stats,
        cabangOptions,
      }}
    />
  )
}
