import { Skeleton } from '@kit/components/ui/skeleton'
import { Separator } from '@kit/components/ui/separator'

export function SnConditionSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-[150px] rounded-md" />
        <Skeleton className="h-7 w-[40px] rounded-md" />
      </div>

      <Separator className="my-3" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 1 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_90px] items-center gap-2 py-1">
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-full rounded-md" />
            <div className="flex items-center justify-end gap-1">
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-7 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 my-2">
        <Skeleton className="h-8 w-[120px] rounded-md" />
        <Skeleton className="h-8 w-[120px] rounded-md" />
        <Skeleton className="h-8 w-[120px] rounded-md" />
      </div>
    </div>
  )
}
