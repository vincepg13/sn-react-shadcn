import { Button } from '@kit/components/ui/button'
import { ConditionGroup } from './sn-condition-group'
import { useFieldCache } from './hooks/useFieldCache'
import { Separator } from '@kit/components/ui/separator'
import { CirclePlus, CircleX, Play } from 'lucide-react'
import { TooltipProvider } from '@kit/components/ui/tooltip'
import { SnSaveFilterDialog } from './sn-save-filter-dialog'
import { SnLoadFilterDialog } from './sn-load-filter-dialog'
import { getParsedQuery, getTableMetadata } from '@kit/utils/conditions-api'
import { serializeConditionModel, useConditionModel, hasConditionValue } from './hooks/useConditionModel'
import { SnConditionSkeleton } from './sn-condition-skeleton'
import { SnConditionsContext } from './contexts/SnConditionsContext'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { SnConditionMap, SnConditionModel, SnConditionNode, SnConditionRow, SnDateTimeMeta, SnFieldCurrencyChoice, SnSavedFilter } from '@kit/types/condition-schema'

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
  canSaveFilter?: boolean
  onQueryBuilt: (encoded: string) => void
  onModelChange?: (builtQuery: string) => void
  onFilterSaved?: (filter: SnSavedFilter) => void
  onFilterLoaded?: (filter: SnSavedFilter) => void
}

export const SnConditions = forwardRef<SnConditionHandle, ConditionProps>(
  (
    {
      table,
      columns,
      queryModel,
      extendToChanges,
      showControls = true,
      canSaveFilter = true,
      onQueryBuilt,
      onModelChange,
      onFilterSaved,
      onFilterLoaded,
    },
    ref
  ) => {
    const { model, updateCondition, deleteCondition, updateModel, executeQuery, clearQuery, addGroup, adjustByIndex, loadModel } =
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

    const handleFilterLoaded = async (filter: SnSavedFilter) => {
      const controller = new AbortController()
      const parsed = await getParsedQuery(table, filter.filter, false, controller)
      if (!parsed) return

      const cache: Record<string, SnConditionMap> = { ...fieldsByTable }

      const resolvePath = async (node: SnConditionRow): Promise<string> => {
        if (!node.references?.length) return table
        const targetTable = node.references[node.references.length - 2].reference_table
        if (!cache[targetTable]) {
          const meta = await getTableMetadata(targetTable, controller)
          if (meta) {
            cache[targetTable] = meta
            setFieldsByTable(prev => ({ ...prev, [targetTable]: meta }))
          }
        }
        return targetTable
      }

      const walkModel = async (nodes: SnConditionNode[]) => {
        for (const node of nodes) {
          if (node.type === 'condition') {
            node.table = await resolvePath(node)
            node.fieldLabel = node.fieldLabel?.replace(/ \. /g, '/')
          } else {
            await walkModel(node.conditions)
          }
        }
      }

      await walkModel(parsed.model)
      loadModel(parsed.model)
      runQuery(parsed.model)
      onFilterLoaded?.(filter)
    }

    useEffect(() => {
      if (!onModelChange) return

      const builtQuery = serializeConditionModel(model, false) || ''
      onModelChange(builtQuery)
    }, [model, onModelChange])

    const liveQuery = useMemo(() => serializeConditionModel(model, false) || '', [model])
    const hasConditions = useMemo(() => hasConditionValue(model), [model])

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
                  {canSaveFilter && (
                    <>
                      <SnSaveFilterDialog
                        table={table}
                        query={liveQuery}
                        disabled={!hasConditions}
                        onSaved={onFilterSaved}
                      />
                      <SnLoadFilterDialog table={table} onLoad={handleFilterLoaded} />
                    </>
                  )}
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
