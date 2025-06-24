import { forwardRef, useImperativeHandle, useState } from 'react'
import { /*toast,*/ Toaster } from 'sonner'
import { Button } from '@kit/components/ui/button'
import { Separator } from '@kit/components/ui/separator'
import { CirclePlus, CircleX, Play } from 'lucide-react'
import { useConditionModel } from './hooks/useConditionModel'
import { ConditionGroup } from './sn-condition-group'
import { SnConditionsContext } from './contexts/SnConditionsContext'
import { SnConditionMap, SnConditionModel, SnDateTimeMeta, SnFieldCurrencyChoice } from '@kit/types/condition-schema'
import { useFieldCache } from './hooks/useFieldCache'
import { TooltipProvider } from '@kit/components/ui/tooltip'
import { SnConditionSkeleton } from './sn-condition-skeleton'

type SnConditionsHandle = {
  adjustModel: (gIndex: number, cIndex: number) => void
}

type ConditionProps = {
  table: string
  initialQuery?: string
  columns: SnConditionMap
  queryModel: SnConditionModel
  onQueryBuilt: (encoded: string) => void
}

export const SnConditions = forwardRef<SnConditionsHandle, ConditionProps>(
  ({ table, columns, queryModel, onQueryBuilt }, ref) => {
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
      adjustModel: (gIndex: number, cIndex: number) => {
        const adjustedModel = gIndex < 0 && cIndex < 0 ? clearQuery() : adjustByIndex(gIndex, cIndex)
        runQuery(adjustedModel)
      },
    }))

    const runQuery = (customModel?: SnConditionModel) => {
      const encoded = executeQuery(customModel)
      // if (!encoded) {
      //   return toast.warning('Please complete all conditions before running the query.')
      // }
      return onQueryBuilt(encoded || '')
    }

    const notLoaded = Object.values(cacheLoaded).some(value => value === false)
    if (notLoaded) {
      return <SnConditionSkeleton />
    }

    return (
      <div>
        <SnConditionsContext.Provider value={{ table, fieldsByTable, dateMeta, currencyMeta, setFieldsByTable }}>
          <TooltipProvider>
            <Toaster position="top-center" expand={true} richColors />

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
            </div>
          </TooltipProvider>
        </SnConditionsContext.Provider>
      </div>
    )
  }
)
