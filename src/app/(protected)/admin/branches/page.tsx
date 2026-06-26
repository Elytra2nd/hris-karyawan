import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { getBranches, createBranch, deleteBranch, updateBranch } from '@/app/actions/branch'
import { BranchManager } from '@/components/branch-manager'
import { MapPin } from '@phosphor-icons/react/ssr'

export default async function BranchesPage() {
  const session = await verifySession()
  if (session.role !== 'ADMIN') redirect('/karyawan')

  const branches = await getBranches()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <MapPin size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cabang</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola daftar cabang organisasi
          </p>
        </div>
      </div>

      <BranchManager
        branches={branches}
        createAction={createBranch}
        deleteAction={deleteBranch}
        updateAction={updateBranch}
      />
    </div>
  )
}
