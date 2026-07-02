import { getContracts, getContractStats, getDistinctPosisi } from '@/app/actions/contract'
import { getDistinctCabang } from '@/app/actions/employee'
import { KontrakClient, PER_PAGE } from './kontrak-client'

// Server Component: seed data awal (tanpa flash skeleton), interaktivitas di client.
export default async function KontrakPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
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
