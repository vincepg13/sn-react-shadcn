import { Skeleton } from '@kit/components/ui/skeleton'
import { Separator } from '@kit/components/ui/separator'

export function SnActivitySkeleton() {
  return (
    <>
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-[80%] rounded-md" />
        <Skeleton className="h-7 w-[20%] rounded-md" />
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </>
  )
}
