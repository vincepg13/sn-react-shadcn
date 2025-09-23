import { AlertCircle } from 'lucide-react'
import { SnConditions } from './sn-conditions'
import { useParsedQuery } from './hooks/useParsedQuery'
import { useFieldMetadata } from './hooks/useTableMetadata'
import { SnConditionSkeleton } from './sn-condition-skeleton'
import { SnConditionDisplayArray } from '@kit/types/condition-schema'
import { Alert, AlertTitle, AlertDescription } from '@kit/components/ui/alert'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

type BuilderProps = {
  table: string
  encodedQuery?: string
  onQueryBuilt: (encoded: string) => void
  emitQueryDisplay?: (display: SnConditionDisplayArray | null) => void
}

function extractOrder(query: string) {
  const match = query.match(/(ORDERBY(?:DESC)?[A-Za-z0-9_]+)(?=$|\^)/)
  return match ? match[1] : null
}

function getBuilderQuery(query?: string) {
  let builderQuery = query || ''

  if (query) {
    const order = extractOrder(query)
    if (order) {
      builderQuery = builderQuery.replace(order, '')
      builderQuery = builderQuery.endsWith('^') ? builderQuery.slice(0, -1) : builderQuery
      builderQuery = builderQuery.startsWith('^') ? builderQuery.slice(1) : builderQuery
    }
  }

  console.log('BQ', builderQuery)
  return builderQuery
}

export type SnConditionHandle = {
  adjustModel: (gIndex: number, cIndex: number) => void
}

export const SnConditionBuilderRef = forwardRef<SnConditionHandle, BuilderProps>(
  ({ table, encodedQuery, emitQueryDisplay, onQueryBuilt }: BuilderProps, ref) => {
    const builderQuery = getBuilderQuery(encodedQuery)
    const [error, setError] = useState<string>('')
    const [loaded, setLoaded] = useState(false)
    useEffect(() => setLoaded(false), [table, encodedQuery])

    const emitDisplay = !!emitQueryDisplay
    const columns = useFieldMetadata(table, setError)
    const { queryModel, queryDisplay, queryParser } = useParsedQuery(table, builderQuery || '', emitDisplay, setError)
    useEffect(() => setLoaded(!!columns && !!queryModel), [columns, queryModel])

    console.log('QM', queryModel)

    const conditionRef = useRef<SnConditionHandle>(null)
    useImperativeHandle(ref, () => ({
      adjustModel: (gIndex: number, cIndex: number) => {
        conditionRef.current?.adjustModel(gIndex, cIndex)
      },
    }))

    useEffect(() => {
      const display = queryDisplay
      if (emitDisplay) emitQueryDisplay?.(display)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emitDisplay, queryDisplay])

    const handleQueryBuilt = useCallback(
      async (encoded: string) => {
        onQueryBuilt(encoded)
        if (emitDisplay) await queryParser(new AbortController(), encoded, false, true)
      },
      [emitDisplay, onQueryBuilt, queryParser]
    )

    if (columns && queryModel) {
      return (
        <SnConditions
          ref={conditionRef}
          table={table}
          columns={columns}
          queryModel={queryModel}
          onQueryBuilt={handleQueryBuilt}
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
)

export function SnConditionBuilder({ table, encodedQuery, onQueryBuilt, emitQueryDisplay }: BuilderProps) {
  return (
    <div className="flex flex-col gap-4">
      <SnConditionBuilderRef
        table={table}
        encodedQuery={encodedQuery}
        emitQueryDisplay={emitQueryDisplay}
        onQueryBuilt={onQueryBuilt}
      />
    </div>
  )
}
