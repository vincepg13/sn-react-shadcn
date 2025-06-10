import { useCallback, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { SnConditionGroup, SnConditionRow, SnConditionModel, SnConditionNode } from '@kit/types/condition-schema'

export type SnAddConditionType = 'add' | 'new' | 'split'

function createEmptyModel(): SnConditionModel {
  return [
    {
      id: uuid(),
      type: 'and',
      conditions: [createEmptyGroup('and')],
    },
  ]
}

function createEmptyGroup(type: 'and' | 'or', condition?: SnConditionNode): SnConditionGroup {
  return {
    id: uuid(),
    type,
    conditions: condition ? [condition, createEmptyCondition()] : [createEmptyCondition()],
  }
}

function createEmptyCondition(): SnConditionRow {
  return {
    id: uuid(),
    type: 'condition',
    field: '',
    operator: '',
    value: '',
  }
}

function addConditionToGroup(groupId: string, model: SnConditionModel): SnConditionModel {
  const add = (group: SnConditionGroup): SnConditionGroup => {
    if (group.id === groupId) {
      return { ...group, conditions: [...group.conditions, createEmptyCondition()] }
    }

    return { ...group, conditions: group.conditions.map(cond => (cond.type === 'condition' ? cond : add(cond))) }
  }

  return model.map(add)
}

function appendAndConditionNear(groupId: string, model: SnConditionModel): SnConditionModel {
  function recurse(group: SnConditionGroup): SnConditionGroup {
    const updatedConditions: typeof group.conditions = []

    let foundTargetIndex: number | null = null
    let reuseAndGroupIndex: number | null = null

    for (let i = 0; i < group.conditions.length; i++) {
      const cond = group.conditions[i]

      if (cond.type !== 'condition') {
        if (cond.id === groupId) foundTargetIndex = i
        updatedConditions.push(recurse(cond))
      } else {
        updatedConditions.push(cond)
      }
    }

    if (foundTargetIndex !== null) {
      for (let i = foundTargetIndex + 1; i < updatedConditions.length; i++) {
        const next = updatedConditions[i]
        if (next.type === 'and') {
          reuseAndGroupIndex = i
          break
        }
      }

      if (reuseAndGroupIndex !== null) {
        const target = updatedConditions[reuseAndGroupIndex] as SnConditionGroup
        const updatedAndGroup = {
          ...target,
          conditions: [...target.conditions, createEmptyCondition()],
        }
        updatedConditions[reuseAndGroupIndex] = updatedAndGroup
      } else {
        const newAndGroup: SnConditionGroup = createEmptyGroup('and')
        updatedConditions.push(newAndGroup)
      }
    }

    return { ...group, conditions: updatedConditions }
  }

  return model.map(recurse)
}

function splitConditionToOrGroup(groupId: string, condId: string, model: SnConditionModel): SnConditionModel {
  let lifted: SnConditionRow | null = null

  function recurse(group: SnConditionGroup): SnConditionGroup | null {
    if (group.id === groupId) {
      const newConditions = group.conditions.filter(cond => {
        const match = cond.type === 'condition' && cond.id === condId
        if (match) lifted = cond
        return !match
      })
      return newConditions.length ? { ...group, conditions: newConditions } : null
    }

    const updatedConditions: SnConditionGroup['conditions'] = []

    for (const cond of group.conditions) {
      if (cond.type === 'condition') {
        updatedConditions.push(cond)
        continue
      }

      const updatedSubgroup = recurse(cond)
      if (updatedSubgroup) updatedConditions.push(updatedSubgroup)

      if (cond.id === groupId && lifted) {
        updatedConditions.push(createEmptyGroup('or', lifted))
      }
    }

    return { ...group, conditions: updatedConditions }
  }

  return model.map(root => recurse(root)).filter(Boolean) as SnConditionModel
}

function updateGroupPartial(
  group: SnConditionGroup,
  groupId: string,
  condId: string,
  partial: Partial<SnConditionRow>
): SnConditionGroup {
  if (group.id === groupId) {
    return {
      ...group,
      conditions: group.conditions.map(c => (c.type === 'condition' && c.id === condId ? { ...c, ...partial } : c)),
    }
  }

  return {
    ...group,
    conditions: group.conditions.map(c =>
      c.type === 'condition' ? c : updateGroupPartial(c, groupId, condId, partial)
    ),
  }
}

function deleteFromGroup(group: SnConditionGroup, groupId: string, condId: string): SnConditionGroup | null {
  if (group.id === groupId) {
    const newConditions = group.conditions.filter(c => !(c.type === 'condition' && c.id === condId))
    if (newConditions.length === 0) return null
    return { ...group, conditions: newConditions }
  }

  const newConditions: SnConditionGroup['conditions'] = []

  for (const c of group.conditions) {
    if (c.type === 'condition') {
      newConditions.push(c)
    } else {
      const updated = deleteFromGroup(c, groupId, condId)
      if (updated) newConditions.push(updated)
    }
  }

  //Convert from OR to AND if only one condition remains
  const cleanedConditions = newConditions.map(c => {
    if (c.type !== 'condition' && c.type === 'or' && c.conditions.length === 1) {
      return {
        ...c,
        type: 'and',
      } as const
    }
    return c
  })

  //Merge touching AND groups
  const mergedConditions = []

  for (let i = 0; i < cleanedConditions.length; i++) {
    const current = cleanedConditions[i]

    if (current.type === 'and' && i > 0 && cleanedConditions[i - 1].type === 'and') {
      const prev = mergedConditions.pop() as SnConditionGroup
      mergedConditions.push({
        ...prev,
        conditions: [...prev.conditions, ...current.conditions],
      })
    } else {
      mergedConditions.push(current)
    }
  }

  if (mergedConditions.length === 0) return null

  return { ...group, conditions: mergedConditions }
}

export function serializeConditionModel(model: SnConditionModel): string | null {
  const invalidConditions: SnConditionNode[] = []

  function validateGroup(group: SnConditionNode): void {
    if (group.type === 'condition') {
      if (!group.field || !group.operator) {
        invalidConditions.push(group)
      }
      return
    }

    group.conditions.forEach(validateGroup)
  }

  model.forEach(validateGroup)
  if (invalidConditions.length > 0) return null

  function serializeGroup(group: SnConditionNode): string {
    if (group.type === 'condition') {
      return `${group.field}${group.operator}${group.value}`
    }

    return group.conditions
      .map(serializeGroup)
      .filter(Boolean)
      .join(group.type === 'or' ? '^OR' : '^')
  }

  return model.map(serializeGroup).filter(Boolean).join('^NQ')
}

export function useConditionModel(initialModel: SnConditionModel) {
  const [model, setModel] = useState(() => initialModel)

  const updateCondition = useCallback((groupId: string, condId: string, partial: Partial<SnConditionRow>) => {
    setModel(prev => prev.map(g => updateGroupPartial(g, groupId, condId, partial)))
  }, [setModel])

  const deleteCondition = (groupId: string, condId: string) => {
    setModel(prev => {
      const updated = prev.map(g => deleteFromGroup(g, groupId, condId)).filter(g => g !== null)
      return updated.length === 0 ? createEmptyModel() : updated
    })
  }

  const updateModel = (groupId: string, type: SnAddConditionType, condId?: string) => {
    if (type === 'add') return setModel(prev => addConditionToGroup(groupId, prev))
    if (type === 'new') return setModel(prev => appendAndConditionNear(groupId, prev))
    if (type === 'split' && condId) return setModel(prev => splitConditionToOrGroup(groupId, condId, prev))
  }

  const executeQuery = () => serializeConditionModel(model)
  const clearQuery = () => setModel(createEmptyModel())
  const addGroup = () => setModel(prev => [...prev].concat(createEmptyModel()))

  return { model, updateCondition, deleteCondition, updateModel, executeQuery, clearQuery, addGroup }
}
