import { Skeleton } from '@/components/ui/skeleton'

/** Loading placeholder shaped like a detail page: the title and a section card of label/value pairs. */
export function DetailSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64 max-w-full" />
      <div className="flex flex-col gap-6 rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {Array.from({ length: fields }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-40 max-w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
