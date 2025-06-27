import { useCallback } from 'react'
import { CirclePlus } from 'lucide-react'
import { ConditionRow } from './sn-condition-row'
import { Button } from '@kit/components/ui/button'
import { SnAddConditionType } from './hooks/useConditionModel'
import { SnConditionGroup, SnConditionMap, SnConditionRow } from '@kit/types/condition-schema'

type GroupProps = {
  group: SnConditionGroup
  columns: SnConditionMap
  root?: boolean
  onModelChange: (groupId: string, type: SnAddConditionType, condId?: string) => void
  onConditionChange: (groupId: string, condId: string, updated: Partial<SnConditionRow>) => void
  onDelete: (groupId: string, condId: string) => void
}

export function ConditionGroup({
  group,
  columns,
  onModelChange,
  onConditionChange,
  onDelete,
  root = false,
}: GroupProps) {
  const handleModelAdd = useCallback(() => {
    const type: SnAddConditionType = group.type === 'and' ? 'add' : 'new'
    onModelChange(group.id, type)
  }, [group.id, group.type, onModelChange])

  const handleModelOr = useCallback(
    (conditionId: string) => {
      const type: SnAddConditionType = group.type === 'and' ? 'split' : 'add'
      onModelChange(group.id, type, conditionId)
    },
    [group.id, group.type, onModelChange]
  )

  const handleConditionChange = useCallback(
    (condId: string, updated: Partial<SnConditionRow>) => {
      onConditionChange(group.id, condId, updated)
    },
    [group.id, onConditionChange]
  )

  const handleRowChange = useCallback(
    (condId: string) => (updated: Partial<SnConditionRow>) => {
      handleConditionChange(condId, updated)
    },
    [handleConditionChange]
  )

  const handleDelete = useCallback(
    (condId: string) => {
      onDelete(group.id, condId)
    },
    [group.id, onDelete]
  )

  return (
    <div>
      {!root && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground uppercase">
            {group.type === 'and' ? 'All of the following' : 'Any of the following'}
          </div>
          <Button type="button" size="icon" variant="outline" onClick={handleModelAdd}>
            <CirclePlus />
          </Button>
        </div>
      )}

      {group.conditions.map(cond =>
        cond.type === 'condition' ? (
          <ConditionRow
            key={cond.id}
            condition={cond}
            columns={columns}
            onOr={handleModelOr}
            onChange={handleRowChange(cond.id)}
            onDelete={() => handleDelete(cond.id)}
          />
        ) : (
          <ConditionGroup
            key={cond.id}
            group={cond}
            columns={columns}
            onModelChange={onModelChange}
            onConditionChange={onConditionChange}
            onDelete={onDelete}
          />
        )
      )}
    </div>
  )
}
