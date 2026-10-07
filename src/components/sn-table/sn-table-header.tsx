import { Input } from '../ui/input'
import { CircleX, ListFilter } from 'lucide-react'
import { Fragment, useEffect, useRef, useState, ReactNode } from 'react'
import { SnLoadingSpinner } from '../sn-ui/sn-loader'
import { SnSimpleTooltip } from '../sn-ui/sn-tooltip'
import { Button } from '../ui/button'
import { SnConditionBuilder } from '../sn-ui/sn-condition-builder/sn-condition-builder'
import { useDebouncedFn } from '@kit/hooks/useDebounceFn'

type SnTableHeaderBaseProps = {
  title: string
  tagline?: string
  table: string
  displayField: string
  query?: string
  referenceQueries?: Record<string, string>
  uuid?: string
  isFetching?: boolean
  actions?: ReactNode[]
  filterChips?: ReactNode[]
  kwSearchType?: 'startsWith' | 'like'
  closeFilterOnQueryChange?: boolean
  onQueryChange: (nextQuery: string) => void
}

type SnTableHeaderProps = SnTableHeaderBaseProps &
  (
    | {
        onClearQuery: () => void
        /** @deprecated Use onClearQuery instead. */
        onResetQuery?: never
      }
    | {
        onClearQuery?: never
        /** @deprecated Use onClearQuery instead. */
        onResetQuery: () => void
      }
  )

function hasFilterCondition(query?: string) {
  return !!query?.split('^').some(segment => {
    const part = segment.trim()
    return !!part && part.toUpperCase() !== 'EQ' && !/^ORDERBY(?:DESC)?[A-Za-z0-9_.]+$/i.test(part)
  })
}

export function SnTableHeader({
  title,
  tagline,
  table,
  displayField,
  query,
  referenceQueries,
  uuid,
  isFetching,
  filterChips,
  actions,
  kwSearchType = 'startsWith',
  closeFilterOnQueryChange = false,
  onQueryChange,
  onClearQuery,
  onResetQuery,
}: SnTableHeaderProps) {
  const [showFilter, setShowFilter] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const prevQueryRef = useRef<string | undefined>(undefined)
  const hasObservedQueryRef = useRef(false)
  const clearQueryCallback = onClearQuery || onResetQuery

  const clearQuery = () => {
    setSearchValue('')
    clearQueryCallback()
  }

  // Query on debounced search from input
  const handleChange = useDebouncedFn((value: string) => {
    if (!value) return clearQuery()
    const nextQuery =
      kwSearchType === 'like' || value.startsWith('*')
        ? `${displayField}LIKE${value.startsWith('*') ? value.slice(1) : value}`
        : `${displayField}STARTSWITH${value}`
    onQueryChange(nextQuery)
  }, 300)

  const handleClearQuery = () => {
    handleChange.cancel()
    clearQuery()
  }

  // Handle query updates from condition builder
  const handleQueryChange = (builderQuery: string) => {
    if (!builderQuery) {
      if (closeFilterOnQueryChange) setShowFilter(false)
      return handleClearQuery()
    }
    if (query === builderQuery) return

    if (closeFilterOnQueryChange) setShowFilter(false)
    onQueryChange(builderQuery)
  }

  useEffect(() => {
    let nextValue = ''
    const leadingCondition = query?.split('^')[0] || ''

    if (leadingCondition) {
      const startsWithPrefix = `${displayField}STARTSWITH`
      const likePrefix = `${displayField}LIKE`

      if (leadingCondition.startsWith(startsWithPrefix)) {
        nextValue = leadingCondition.slice(startsWithPrefix.length)
      } else if (leadingCondition.startsWith(likePrefix)) {
        nextValue = `*${leadingCondition.slice(likePrefix.length)}`
      }
    }

    setSearchValue(prev => (prev === nextValue ? prev : nextValue))
  }, [query, displayField])

  useEffect(() => {
    if (closeFilterOnQueryChange && hasObservedQueryRef.current && prevQueryRef.current !== query && showFilter) {
      setShowFilter(false)
    }
    prevQueryRef.current = query
    hasObservedQueryRef.current = true
  }, [closeFilterOnQueryChange, query, showFilter])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between w-full flex-wrap gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight flex gap-1 items-center">{title}</h2>
          {tagline ? <p className="text-muted-foreground">{tagline}</p> : null}
        </div>
        <div className="flex items-center gap-2 w-full mt-2 lg:w-auto lg:mt-0">
          {isFetching && <SnLoadingSpinner className="h-6 w-6" />}
          {filterChips?.map((chip, index) => (
            <Fragment key={`sn-table-header-chip-${index}`}>{chip}</Fragment>
          ))}
          <Input
            type="text"
            value={searchValue}
            onChange={e => {
              setSearchValue(e.target.value)
              handleChange(e.target.value)
            }}
            placeholder={`Search by ${displayField}...`}
          />
          <SnSimpleTooltip content={showFilter ? 'Close Advanced Filter' : 'Open Advanced Filter'}>
            <Button variant="outline" size="icon" onClick={() => setShowFilter(!showFilter)}>
              <span className={`transition-transform duration-300 ease-in-out ${showFilter ? 'rotate-180' : ''}`}>
                <ListFilter />
              </span>
            </Button>
          </SnSimpleTooltip>
          {actions?.map((action, index) => (
            <Fragment key={`sn-table-header-action-${index}`}>{action}</Fragment>
          ))}
          {hasFilterCondition(query) && (
            <SnSimpleTooltip content="Clear filters">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Clear filters"
                onClick={handleClearQuery}
                data-slot="sn-th-clear-filters"
              >
                <CircleX />
              </Button>
            </SnSimpleTooltip>
          )}
        </div>
      </div>
      <div className={showFilter ? 'block' : 'hidden'}>
        <SnConditionBuilder
          key={uuid}
          table={table}
          encodedQuery={query || ''}
          referenceQueries={referenceQueries}
          onQueryBuilt={handleQueryChange}
        />
      </div>
    </div>
  )
}
