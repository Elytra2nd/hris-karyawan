import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden mt-6">
        <div className="h-12 border-b border-border bg-muted/40" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[180px]" />
              </div>
              <Skeleton className="h-8 w-[100px] rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
