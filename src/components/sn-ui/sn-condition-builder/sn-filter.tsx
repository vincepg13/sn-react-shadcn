import { createPortal } from 'react-dom'
import { Button } from '@kit/components/ui/button'
import { useRef, useState, ReactNode } from 'react'
import { mergeOrItems } from '@kit/utils/conditions-api'
import { ChevronRight, ListFilter, LoaderCircle } from 'lucide-react'
import { SnConditionDisplayArray } from '@kit/types/condition-schema'
import { SnConditionBuilderRef, SnConditionHandle } from './sn-condition-builder'

type FilterProps = {
  table: string
  encodedQuery?: string
  initialOpenState?: 'open' | 'closed'
  onToggle?: (open?: boolean) => void
  onQueryBuilt?: (encoded: string) => void

  /** If provided, the condition builder renders into this element via a portal. */
  builderPortalTarget?: HTMLElement | null

  /** Optional wrapper for the builder (e.g., to put it in a Card/Panel). */
  builderRender?: (args: { builder: ReactNode; show: boolean; setShow: (v: boolean) => void }) => ReactNode
}

export function SnFilter({
  table,
  encodedQuery,
  initialOpenState,
  onToggle,
  onQueryBuilt,
  builderPortalTarget,
  builderRender,
}: FilterProps) {
  const localQuery = useRef<string>(encodedQuery || '')
  const conditionRef = useRef<SnConditionHandle>(null)

  const [displayLoading, setDisplayLoading] = useState(false)
  const [crumbs, setCrumbs] = useState<SnConditionDisplayArray | null>(null)
  const [showBuilder, setShowBuilder] = useState(initialOpenState === 'open')

  const handleFilterChange = (gIndex: number, cIndex: number) => {
    if (gIndex < 0 && cIndex < 0) {
      setCrumbs(null)
      return conditionRef.current?.adjustModel(-1, -1)
    }

    setCrumbs(prev => {
      if (!prev) return null
      const newCrumbs = prev.filter((_, index) => index <= gIndex)
      newCrumbs[gIndex] = newCrumbs[gIndex].filter((_, index) => index <= cIndex)
      return newCrumbs
    })

    return conditionRef.current?.adjustModel(gIndex, cIndex)
  }

  const handleQueryBuilt = (encoded: string) => {
    setDisplayLoading(true)
    localQuery.current = encoded
    onQueryBuilt?.(encoded)
    if (showBuilder) setShowBuilder(false)
  }

  const handleDisplayUpdate = (display: SnConditionDisplayArray | null) => {
    setCrumbs(display)
    setDisplayLoading(false)
  }

  const builderInner = (
    <div className={showBuilder ? 'block' : 'hidden'}>
      <SnConditionBuilderRef
        ref={conditionRef}
        table={table}
        encodedQuery={encodedQuery}
        onQueryBuilt={handleQueryBuilt}
        emitQueryDisplay={handleDisplayUpdate}
      />
    </div>
  )

  const builderContent = builderRender
    ? builderRender({ builder: builderInner, show: showBuilder, setShow: setShowBuilder })
    : builderInner

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Button variant="outline" size="icon" onClick={() => {
          onToggle?.(!showBuilder)
          setShowBuilder(!showBuilder)
        }}>
          {displayLoading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <span className={`transition-transform duration-300 ease-in-out ${showBuilder ? 'rotate-180' : ''}`}>
              <ListFilter />
            </span>
          )}
        </Button>
        <div>
          <span>
            <a
              className="cursor-pointer text-sm hover:underline text-muted-foreground"
              onClick={() => handleFilterChange(-1, -1)}
            >
              All
            </a>
            {crumbs?.length && <ChevronRight className="inline h-4 w-4" />}
          </span>
          {crumbs &&
            crumbs.length > 0 &&
            mergeOrItems(crumbs).map((crumb, index) => (
              <span key={index}>
                <span className="font-semibold">{index > 0 && ' or '}</span>
                {crumb.map((c, i) => (
                  <span key={c.id}>
                    <a
                      className="cursor-pointer text-sm hover:underline text-muted-foreground"
                      onClick={() => {
                        const id = c.id.split(':')
                        return handleFilterChange(+id[0], +id[1])
                      }}
                    >
                      {c.display}
                    </a>
                    {i < crumb.length - 1 && <ChevronRight className="inline h-4 w-4" />}
                  </span>
                ))}
              </span>
            ))}
        </div>
      </div>

      {/* Fallback inline render if no portal target supplied */}
      {!builderPortalTarget && builderContent}

      {/* If a target is supplied, render the builder there */}
      {builderPortalTarget ? createPortal(builderContent, builderPortalTarget) : null}
    </div>
  )
}
