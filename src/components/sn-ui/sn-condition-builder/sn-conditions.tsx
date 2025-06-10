import { toast, Toaster } from 'sonner'
import { Button } from '@kit/components/ui/button'
import { Separator } from '@kit/components/ui/separator'
import { CirclePlus, CircleX, Play } from 'lucide-react'
import { useConditionModel } from './hooks/useConditionModel'
import { ConditionGroup } from './sn-condition-group'
import { SnConditionsContext } from './contexts/SnConditionsContext'
import { SnConditionMap, SnConditionModel, SnDateTimeMeta, SnFieldCurrencyChoice } from '@kit/types/condition-schema'
import { useFieldCache } from './hooks/useFieldCache'
import { TooltipProvider } from '@kit/components/ui/tooltip'
import { useState } from 'react'
import { SnConditionSkeleton } from './sn-condition-skeleton'

type ConditionProps = {
  table: string
  initialQuery?: string
  columns: SnConditionMap
  queryModel: SnConditionModel
  onQueryBuilt: (encoded: string) => void
}

export function SnConditions({ table, columns, queryModel, onQueryBuilt }: ConditionProps) {
  const { model, updateCondition, deleteCondition, updateModel, executeQuery, clearQuery, addGroup } =
    useConditionModel(queryModel)

  const [dateMeta, setDateMeta] = useState<SnDateTimeMeta | null>(null)
  const [currencyMeta, setCurrencyMeta] = useState<SnFieldCurrencyChoice[]>([])
  const { cacheLoaded, fieldsByTable, setFieldsByTable } = useFieldCache(table, columns, model)

  const runQuery = () => {
    const encoded = executeQuery()
    if (!encoded) {
      return toast.warning('Please complete all conditions before running the query.')
    }
    return onQueryBuilt(encoded)
  }

  if (!cacheLoaded) {
    return <SnConditionSkeleton />
  }

  return (
    <SnConditionsContext.Provider
      value={{ table, fieldsByTable, dateMeta, currencyMeta, setFieldsByTable, setDateMeta, setCurrencyMeta }}
    >
      <TooltipProvider>
        <div className="sn-conditions flex flex-col gap-4">
          <Toaster position="top-center" expand={true} richColors />

          {model.map((group, i) => (
            <div key={group.id}>
              {model.length > 1 && (
                <div className="mb-2">
                  <span>Condition Group {i + 1}</span>
                  <Separator className="w-full" />
                </div>
              )}
              <div className="overflow-x-auto">
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
            <Button onClick={runQuery}>
              <Play /> Run
            </Button>
          </div>
        </div>
      </TooltipProvider>
    </SnConditionsContext.Provider>
  )
}
