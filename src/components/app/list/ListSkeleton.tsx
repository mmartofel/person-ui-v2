import { Skeleton } from '@/components/ui/skeleton'

/** Loading placeholder shaped like DataTable inside its card: a header and rows of `columns` cells from `md`, card rows below. */
export function ListSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const cells = Array.from({ length: columns }, (_, i) => i)
  return (
    <>
      <div className="hidden md:block">
        <div className="flex h-10 items-center gap-6 border-b px-6">
          {cells.map((i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex h-12 items-center gap-6 border-b px-6 last:border-0">
            {cells.map((i) => (
              <Skeleton key={i} className={i === 0 ? 'h-4 flex-[1.5]' : 'h-4 flex-1'} />
            ))}
          </div>
        ))}
      </div>
      <div className="divide-y md:hidden">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex flex-col gap-2 px-4 py-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </>
  )
}
