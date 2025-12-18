import { Button } from '@kit/components/ui/button'
import { ConditionGroup } from './sn-condition-group'
import { useFieldCache } from './hooks/useFieldCache'
import { Separator } from '@kit/components/ui/separator'
import { CirclePlus, CircleX, Play } from 'lucide-react'
import { TooltipProvider } from '@kit/components/ui/tooltip'
import { serializeConditionModel, useConditionModel } from './hooks/useConditionModel'
import { SnConditionSkeleton } from './sn-condition-skeleton'
import { SnConditionsContext } from './contexts/SnConditionsContext'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { SnConditionMap, SnConditionModel, SnDateTimeMeta, SnFieldCurrencyChoice } from '@kit/types/condition-schema'

export type SnConditionHandle = {
  addGroup: () => void
  clearQuery: () => void
  adjustModel: (gIndex: number, cIndex: number) => void
}

type ConditionProps = {
  table: string
  initialQuery?: string
  columns: SnConditionMap
  queryModel: SnConditionModel
  showControls?: boolean
  extendToChanges?: boolean
  onQueryBuilt: (encoded: string) => void
  onModelChange?: (builtQuery: string) => void
}

export const SnConditions = forwardRef<SnConditionHandle, ConditionProps>(
  ({ table, columns, queryModel, extendToChanges, showControls = true, onQueryBuilt, onModelChange }, ref) => {
    const { model, updateCondition, deleteCondition, updateModel, executeQuery, clearQuery, addGroup, adjustByIndex } =
      useConditionModel(queryModel)

    const [dateMeta, setDateMeta] = useState<SnDateTimeMeta | null>(null)
    const [currencyMeta, setCurrencyMeta] = useState<SnFieldCurrencyChoice[]>([])
    const { cacheLoaded, fieldsByTable, setFieldsByTable } = useFieldCache(
      table,
      columns,
      model,
      dateMeta,
      currencyMeta,
      setDateMeta,
      setCurrencyMeta
    )

    useImperativeHandle(ref, () => ({
      addGroup,
      clearQuery,
      adjustModel: (gIndex: number, cIndex: number) => {
        const adjustedModel = gIndex < 0 && cIndex < 0 ? clearQuery() : adjustByIndex(gIndex, cIndex)
        runQuery(adjustedModel)
      },
    }))

    const runQuery = (customModel?: SnConditionModel) => {
      return onQueryBuilt(executeQuery(customModel) || '')
    }

    useEffect(() => {
      if (!onModelChange) return

      const builtQuery = serializeConditionModel(model, false) || ''
      onModelChange(builtQuery)
    }, [model, onModelChange])

    const notLoaded = Object.values(cacheLoaded).some(value => value === false)

    const ctxValue = useMemo(
      () => ({
        table,
        fieldsByTable,
        dateMeta,
        currencyMeta,
        extended: extendToChanges || false,
        setFieldsByTable,
      }),
      [table, fieldsByTable, dateMeta, currencyMeta, extendToChanges, setFieldsByTable]
    )

    if (notLoaded) return <SnConditionSkeleton />

    return (
      <div>
        <SnConditionsContext.Provider value={ctxValue}>
          <TooltipProvider>
            <div className="sn-conditions flex flex-col gap-4">
              {model.map((group, i) => (
                <div key={group.id}>
                  {model.length > 1 && (
                    <div className="mb-2">
                      <span className="leading-none font-medium">Condition Group {i + 1}</span>
                      <Separator className="w-full" />
                    </div>
                  )}
                  <div className="">
                    <ConditionGroup
                      key={group.id}
                      group={group}
                      columns={columns}
                      root={true}
                      onModelChange={updateModel}
                      onConditionChange={updateCondition}
                      onDelete={deleteCondition}
                    />
                  </div>
                </div>
              ))}

              {showControls && (
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" onClick={addGroup}>
                    <CirclePlus />
                    New Group
                  </Button>
                  <Button variant="outline" onClick={clearQuery}>
                    <CircleX />
                    Clear All
                  </Button>
                  <Button onClick={() => runQuery()}>
                    <Play /> Run
                  </Button>
                </div>
              )}
            </div>
          </TooltipProvider>
        </SnConditionsContext.Provider>
      </div>
    )
  }
)
