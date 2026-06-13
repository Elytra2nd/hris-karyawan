import { Skeleton } from "@/components/ui/skeleton"

export default function DetailKaryawanLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Skeleton className="h-8 w-[250px]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[120px]" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center md:items-start shadow-sm">
        <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-xl shrink-0" />
        <div className="space-y-4 flex-1 w-full text-center md:text-left flex flex-col items-center md:items-start">
          <Skeleton className="h-8 w-[280px]" />
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <Skeleton className="h-5 w-[120px]" />
            <Skeleton className="h-5 w-[150px]" />
            <Skeleton className="h-5 w-[130px]" />
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-md pt-4">
             <Skeleton className="h-14 w-full" />
             <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>

      {/* 2-Col Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-lg shadow-sm">
           <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
             <Skeleton className="h-7 w-7 rounded-md" />
             <Skeleton className="h-5 w-[150px]" />
           </div>
           <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
           </div>
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm">
           <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
             <Skeleton className="h-7 w-7 rounded-md" />
             <Skeleton className="h-5 w-[150px]" />
           </div>
           <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
              <div className="space-y-2"><Skeleton className="h-3 w-[80px]" /><Skeleton className="h-5 w-[120px]" /></div>
           </div>
        </div>
      </div>
    </div>
  )
}
