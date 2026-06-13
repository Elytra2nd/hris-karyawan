import { Skeleton } from "@/components/ui/skeleton"

export default function KaryawanLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <div className="h-12 border-b border-border bg-muted/40" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-5">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-3 w-[180px]" />
              </div>
              <Skeleton className="h-6 w-[100px] rounded-full" />
              <Skeleton className="h-8 w-[120px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
