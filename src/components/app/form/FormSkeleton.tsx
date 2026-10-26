import { Skeleton } from '@/components/ui/skeleton'

/** Loading placeholder shaped like an edit page: the title and a section card of label/input pairs. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-64 max-w-full" />
      <div className="flex flex-col gap-5 rounded-xl border bg-card p-6">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
