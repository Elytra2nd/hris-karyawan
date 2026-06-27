import { verifySession } from '@/lib/dal'
import { redirect } from 'next/navigation'
import { hasPermission } from '@/lib/auth-guard'
import { getPositions, createPosition, deletePosition, updatePosition } from '@/app/actions/position'
import { PositionManager } from '@/components/position-manager'
import { Buildings } from '@phosphor-icons/react/ssr'

export default async function PositionsPage() {
  const session = await verifySession()
  if (!hasPermission(session.role, 'position_manage')) redirect('/karyawan')

  const positions = await getPositions()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Buildings size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Posisi</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelola posisi / jabatan dan durasi kontraknya
          </p>
        </div>
      </div>

      <PositionManager
        positions={positions}
        createAction={createPosition}
        deleteAction={deletePosition}
        updateAction={updatePosition}
      />
    </div>
  )
}
