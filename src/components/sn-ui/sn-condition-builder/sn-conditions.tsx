import { toast, Toaster } from 'sonner'
import { Button } from '@kit/components/ui/button'
import { ConditionGroup } from './sn-condition-group'
import { Separator } from '@kit/components/ui/separator'
import { CirclePlus, CircleX, Play } from 'lucide-react'
import { useConditionModel } from './hooks/useConditionModel'
import { SnConditionMap, SnConditionModel } from '@kit/types/condition-schema'

type ConditionProps = {
  table: string
  columns: SnConditionMap
  queryModel: SnConditionModel
  onQueryBuilt: (encoded: string) => void
}

export function SnConditions({ table, columns, queryModel, onQueryBuilt }: ConditionProps) {
  const { model, updateCondition, deleteCondition, updateModel, executeQuery, clearQuery, addGroup } =
    useConditionModel(queryModel)

  const runQuery = () => {
    const encoded = executeQuery()

    if (!encoded) return toast.warning('Please complete all conditions before running the query.')

    return onQueryBuilt(encoded)
  }

  console.log('Sn Conditions Building:', table, columns, model)
  return (
    <div className="sn-conditions">
      <Toaster position="top-center" expand={true} richColors />

      {model.map((group, i) => (
        <div key={group.id}>
          {model.length > 1 && (
            <div className="mb-2">
              <span>Condition Group {i + 1}</span>
              <Separator className="w-full" />
            </div>
          )}
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
  )
}
