import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SnDataTableSkeleton({ rowCount = 5, columnCount = 5 }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      {/* Header Row */}
      <div className="flex space-x-2">
        {Array.from({ length: columnCount }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-24 flex-1 rounded-md" />
        ))}
      </div>

      <Separator />

      {/* Data Rows */}
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex space-x-2">
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 w-20 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SnDataTableSkeletonError({ error, columnCount = 5 }: { error: string; columnCount?: number }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      {/* Header Row */}
      <div className="flex space-x-2">
        {Array.from({ length: columnCount }).map((_, idx) => (
          <Skeleton key={idx} className="h-4 w-24 flex-1 rounded-md" />
        ))}
      </div>

      <Separator />

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>

      {/* Data Rows */}
      {/* {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <div key={rowIdx} className='flex space-x-2'>
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <Skeleton key={colIdx} className='h-4 w-20 flex-1 rounded-md' />
          ))}
        </div>
      ))} */}
    </div>
  );
}
