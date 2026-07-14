import { getContracts, getContractStats, getDistinctPosisi } from '@/app/actions/contract'
import { getDistinctCabang } from '@/app/actions/employee'
import { verifySession } from '@/lib/dal'
import { hasPermission } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { KontrakClient, PER_PAGE } from './kontrak-client'

// Server Component: seed data awal (tanpa flash skeleton), interaktivitas di client.
// Digate contract_create — halaman ini adalah pintu ke manajemen kontrak
// (link per-baris ke /karyawan/[id]/kontrak), bukan sekadar monitoring.
// VIEWER tidak melihat item ini di sidebar (app-sidebar.tsx); redirect di sini
// mencegah akses langsung via URL (bukan throw, agar tidak jatuh ke error boundary).
export default async function KontrakPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const session = await verifySession()
  if (!hasPermission(session.role, 'contract_create')) redirect('/karyawan')

  const sp = await searchParams
  const search = sp.search ?? ''
  const cabang = sp.cabang ?? ''
  const status = sp.status ?? ''
  const posisi = sp.posisi ?? ''
  const page = Math.max(1, parseInt(sp.page ?? '1'))

  const [data, stats, cabangOptions, posisiOptions] = await Promise.all([
    getContracts({ search, cabang, status, posisi, page, perPage: PER_PAGE }),
    getContractStats({ search, cabang, posisi }),
    getDistinctCabang(),
    getDistinctPosisi(),
  ])

  return (
    <KontrakClient
      initial={{
        contracts: data.contracts,
        total: data.total,
        loadError: data.loadError,
        stats,
        cabangOptions,
        posisiOptions,
      }}
    />
  )
}
