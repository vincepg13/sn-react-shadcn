import { useRef, useState } from 'react'
import { SnConditionBuilder, SnConditionHandle } from './sn-condition-builder'
import { Button } from '@kit/components/ui/button'
import { ChevronRight, ListFilter } from 'lucide-react'
import { SnConditionDisplayArray, SnConditionDisplayItem } from '@kit/types/condition-schema'

type FilterProps = {
  table: string
  encodedQuery?: string
  onQueryBuilt: (encoded: string) => void
}

function mergeOrItems(groups: SnConditionDisplayArray): SnConditionDisplayArray {
  return groups.map(group => {
    const result: SnConditionDisplayItem[] = []
    let buffer: SnConditionDisplayItem[] = []

    for (const item of group) {
      if (item.or) {
        buffer.push(item)
      } else {
        if (buffer.length > 0) {
          result.push(mergeBuffer(buffer))
          buffer = []
        }
        result.push(item)
      }
    }
    if (buffer.length > 0) {
      result.push(mergeBuffer(buffer))
    }

    return result
  })

  function mergeBuffer(buffer: SnConditionDisplayItem[]): SnConditionDisplayItem {
    return {
      display: buffer.map(i => i.display).join(' .or. '),
      id: buffer[buffer.length - 1].id,
    }
  }
}

export function SnFilter({ table, encodedQuery, onQueryBuilt }: FilterProps) {
  const localQuery = useRef<string>(encodedQuery || '')
  const conditionRef = useRef<SnConditionHandle>(null)

  const [showBuilder, setShowBuilder] = useState(false)
  const [crumbs, setCrumbs] = useState<SnConditionDisplayArray | null>(null)

  const handleFilterChange = (gIndex: number, cIndex: number) => {
    if (gIndex < 0 && cIndex < 0) {
      setCrumbs(null)
      return conditionRef.current?.adjustModel(-1, -1)
    }

    setCrumbs(prev => {
      if (!prev) return null

      let newCrumbs = prev.filter((_, index) => index <= gIndex)
      newCrumbs[gIndex] = newCrumbs[gIndex].filter((_, index) => index <= cIndex)
      return newCrumbs
    })

    return conditionRef.current?.adjustModel(gIndex, cIndex)
  }

  const handleQueryBuilt = (encoded: string) => {
    localQuery.current = encoded
    onQueryBuilt(encoded)
    if (showBuilder) setShowBuilder(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <Button variant="outline" size="icon" onClick={() => setShowBuilder(!showBuilder)}>
          <ListFilter />
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
      <div className={showBuilder ? 'block' : 'hidden'}>
        <SnConditionBuilder
          ref={conditionRef}
          table={table}
          encodedQuery={encodedQuery}
          onQueryBuilt={handleQueryBuilt}
          emitQueryDisplay={setCrumbs}
        />
      </div>
    </div>
  )
}
