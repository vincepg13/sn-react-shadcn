import { AlertCircle } from 'lucide-react'
import { SnConditionHandle, SnConditions } from './sn-conditions'
import { useParsedQuery } from './hooks/useParsedQuery'
import { useFieldMetadata } from './hooks/useTableMetadata'
import { SnConditionSkeleton } from './sn-condition-skeleton'
import { SnConditionDisplayArray, SnSavedFilter } from '@kit/types/condition-schema'
import { Alert, AlertTitle, AlertDescription } from '@kit/components/ui/alert'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

type BuilderProps = {
  table: string
  encodedQuery?: string
  showControls?: boolean
  extendToChanges?: boolean
  canSaveFilter?: boolean
  onQueryBuilt?: (encoded: string) => void
  onModelChange?: (builtQuery: string) => void
  emitQueryDisplay?: (display: SnConditionDisplayArray | null) => void
  onFilterSaved?: (filter: SnSavedFilter) => void
  onFilterLoaded?: (filter: SnSavedFilter) => void
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

  return builderQuery
}

export const SnConditionBuilderRef = forwardRef<SnConditionHandle, BuilderProps>(
  (
    { table, encodedQuery, showControls, extendToChanges, canSaveFilter, emitQueryDisplay, onQueryBuilt, onModelChange, onFilterSaved, onFilterLoaded }: BuilderProps,
    ref
  ) => {
    const builderQuery = getBuilderQuery(encodedQuery)
    const [error, setError] = useState<string>('')
    const [loaded, setLoaded] = useState(false)
    useEffect(() => setLoaded(false), [table, encodedQuery])

    const emitDisplay = !!emitQueryDisplay
    const columns = useFieldMetadata(table, setError)
    const { queryModel, queryDisplay, queryParser } = useParsedQuery(table, builderQuery || '', emitDisplay, setError)
    useEffect(() => setLoaded(!!columns && !!queryModel), [columns, queryModel])

    const conditionRef = useRef<SnConditionHandle>(null)
    useImperativeHandle(ref, () => ({
      adjustModel: (gIndex: number, cIndex: number) => {
        conditionRef.current?.adjustModel(gIndex, cIndex)
      },
      addGroup: () => {
        conditionRef.current?.addGroup()
      },
      clearQuery: () => {
        conditionRef.current?.clearQuery()
      },
    }))

    useEffect(() => {
      const display = queryDisplay
      if (emitDisplay) emitQueryDisplay?.(display)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emitDisplay, queryDisplay])

    const handleQueryBuilt = useCallback(
      async (encoded: string) => {
        onQueryBuilt?.(encoded)
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
          showControls={showControls}
          extendToChanges={extendToChanges}
          canSaveFilter={canSaveFilter}
          onModelChange={onModelChange}
          onQueryBuilt={handleQueryBuilt}
          onFilterSaved={onFilterSaved}
          onFilterLoaded={onFilterLoaded}
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

export function SnConditionBuilder({
  table,
  encodedQuery,
  showControls,
  canSaveFilter,
  onQueryBuilt,
  emitQueryDisplay,
  onModelChange,
  onFilterSaved,
  onFilterLoaded,
}: BuilderProps) {
  return (
    <div className="flex flex-col gap-4">
      <SnConditionBuilderRef
        table={table}
        encodedQuery={encodedQuery}
        showControls={showControls}
        canSaveFilter={canSaveFilter}
        emitQueryDisplay={emitQueryDisplay}
        onQueryBuilt={onQueryBuilt}
        onModelChange={onModelChange}
        onFilterSaved={onFilterSaved}
        onFilterLoaded={onFilterLoaded}
      />
    </div>
  )
}
