import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[150px]" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-[80px]" />
              <Skeleton className="h-6 w-[40px]" />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column: Kontrak & Ringkasan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box 1 */}
        <div className="bg-card border border-border rounded-lg shadow-sm h-[350px] p-6 space-y-4">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-[200px]" />
          </div>
          <div className="space-y-3 mt-6">
            <Skeleton className="h-[60px] w-full rounded-md" />
            <Skeleton className="h-[60px] w-full rounded-md" />
            <Skeleton className="h-[60px] w-full rounded-md" />
            <Skeleton className="h-[60px] w-full rounded-md" />
          </div>
        </div>
        {/* Box 2 */}
        <div className="bg-card border border-border rounded-lg shadow-sm h-[350px] p-6 space-y-4">
          <div className="flex gap-4 items-center">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-5 w-[200px]" />
          </div>
          <div className="flex justify-center mt-6">
            <Skeleton className="h-[220px] w-[220px] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
