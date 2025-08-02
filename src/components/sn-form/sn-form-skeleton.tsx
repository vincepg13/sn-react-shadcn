import { Skeleton } from '@kit/components/ui/skeleton'

function FieldSkeleton({ fieldHeight }: { fieldHeight: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={`h-4 w-[150px] rounded-md`} />
      <Skeleton className={`${fieldHeight} w-full rounded-md`} />
    </div>
  )
}

export function SnFormSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8">
      <div className="grid grid-cols-2 items-center justify-between gap-4">
        <FieldSkeleton fieldHeight="h-8" />
        <FieldSkeleton fieldHeight="h-8" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-full rounded-md" />
        <Skeleton className="h-7 w-full rounded-md" />
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 items-center justify-between gap-4">
            <FieldSkeleton fieldHeight="h-8" />
            <FieldSkeleton fieldHeight="h-8" />
          </div>
        ))}
        <FieldSkeleton fieldHeight="h-20" />
      </div>
    </div>
  )
}
