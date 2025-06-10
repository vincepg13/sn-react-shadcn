import { AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SnConditions } from './sn-conditions'
import { useParsedQuery } from './hooks/useParsedQuery'
import { useFieldMetadata } from './hooks/useTableMetadata'
import { SnConditionSkeleton } from './sn-condition-skeleton'
import { Alert, AlertTitle, AlertDescription } from '@kit/components/ui/alert'

type BuilderProps = {
  table: string
  encodedQuery?: string
  onQueryBuilt: (encoded: string) => void
}

export function SnConditionBuilder({ table, encodedQuery, onQueryBuilt }: BuilderProps) {
  const [error, setError] = useState<string>('')
  const [loaded, setLoaded] = useState(false)
  useEffect(() => setLoaded(false), [table, encodedQuery])

  const columns = useFieldMetadata(table, setError)
  const model = useParsedQuery(table, encodedQuery || '', setError)
  useEffect(() => setLoaded(!!columns && !!model), [columns, model])

  // return <SnConditionSkeleton />

  if (columns && model) {
    return (
      <SnConditions
        key={`${table}:${encodedQuery}`}
        table={table}
        columns={columns}
        queryModel={model}
        onQueryBuilt={onQueryBuilt}
      />
    )
  } else {
    if (error)
      return (
        <Alert variant="destructive" className="max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    if (!loaded) return <SnConditionSkeleton />
  }
}
