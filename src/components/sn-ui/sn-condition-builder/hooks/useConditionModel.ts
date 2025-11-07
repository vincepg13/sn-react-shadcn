import { v4 as uuid } from 'uuid'
import { useCallback, useState } from 'react'
import {
  SnConditionGroup,
  SnConditionRow,
  SnConditionModel,
  SnConditionNode,
} from '@kit/types/condition-schema'

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

/** Update a single condition (by ids) within the tree. Preserves references elsewhere. */
function updateGroupPartial(
  group: SnConditionGroup,
  groupId: string,
  condId: string,
  partial: Partial<SnConditionRow>
): SnConditionGroup {
  if (group.id === groupId) {
    let changed = false
    const nextConds = group.conditions.map((c) => {
      if (c.type === 'condition' && c.id === condId) {
        changed = true
        return { ...c, ...partial }
      }
      return c
    })
    return changed ? { ...group, conditions: nextConds } : group
  }

  let childChanged = false
  const nextConds = group.conditions.map((c) => {
    if (c.type === 'condition') return c
    const next = updateGroupPartial(c, groupId, condId, partial)
    if (next !== c) childChanged = true
    return next
  })

  return childChanged ? { ...group, conditions: nextConds } : group
}

/** Add an empty condition to a specific group id. */
function addConditionToGroup(groupId: string, model: SnConditionModel): [SnConditionModel, boolean] {
  let rootChanged = false

  const add = (group: SnConditionGroup): SnConditionGroup => {
    if (group.id === groupId) {
      rootChanged = true
      return { ...group, conditions: [...group.conditions, createEmptyCondition()] }
    }

    let childChanged = false
    const next = group.conditions.map((cond) => {
      if (cond.type === 'condition') return cond
      const updated = add(cond)
      if (updated !== cond) childChanged = true
      return updated
    })

    return childChanged ? { ...group, conditions: next } : group
  }

  const nextModel = model.map(add)
  return [rootChanged ? nextModel : model, rootChanged]
}

/** Append an AND group "nearby" a target group, but only copy along changed branches. */
function appendAndConditionNear(groupId: string, model: SnConditionModel): [SnConditionModel, boolean] {
  let rootChanged = false

  function recurse(group: SnConditionGroup): SnConditionGroup {
    let foundTargetIndex: number | null = null
    let reuseAndGroupIndex: number | null = null
    let childChanged = false

    const updatedConditions: typeof group.conditions = group.conditions.map((cond, i) => {
      if (cond.type === 'condition') return cond
      if (cond.id === groupId) foundTargetIndex = i
      const next = recurse(cond)
      if (next !== cond) childChanged = true
      return next
    })

    if (foundTargetIndex !== null) {
      // search ahead for an AND group to reuse
      for (let i = foundTargetIndex + 1; i < updatedConditions.length; i++) {
        const next = updatedConditions[i]
        if (next.type !== 'condition' && next.type === 'and') {
          reuseAndGroupIndex = i
          break
        }
      }

      if (reuseAndGroupIndex !== null) {
        const target = updatedConditions[reuseAndGroupIndex] as SnConditionGroup
        const updatedAndGroup: SnConditionGroup = {
          ...target,
          conditions: [...target.conditions, createEmptyCondition()],
        }
        if (updatedAndGroup !== target) {
          updatedConditions[reuseAndGroupIndex] = updatedAndGroup
          childChanged = true
        }
      } else {
        // push a new AND group
        updatedConditions.push(createEmptyGroup('and'))
        childChanged = true
      }
    }

    if (childChanged) rootChanged = true
    return childChanged ? { ...group, conditions: updatedConditions } : group
  }

  const nextModel = model.map(recurse)
  return [rootChanged ? nextModel : model, rootChanged]
}

/** Lift a condition into a sibling OR group, with structural sharing. */
function splitConditionToOrGroup(
  groupId: string,
  condId: string,
  model: SnConditionModel
): [SnConditionModel, boolean] {
  let rootChanged = false
  let lifted: SnConditionRow | null = null

  function recurse(group: SnConditionGroup): SnConditionGroup | null {
    if (group.id === groupId) {
      let changedLocal = false
      const newConditions = group.conditions.filter((cond) => {
        const isTarget = cond.type === 'condition' && cond.id === condId
        if (isTarget) lifted = cond
        if (isTarget) changedLocal = true
        return !isTarget
      })
      if (!newConditions.length) return null
      if (changedLocal) {
        rootChanged = true
        return { ...group, conditions: newConditions }
      }
      return group
    }

    let childChanged = false
    const nextConds: SnConditionGroup['conditions'] = []

    for (const cond of group.conditions) {
      if (cond.type === 'condition') {
        nextConds.push(cond)
        continue
      }

      const updated = recurse(cond)
      if (updated) {
        if (updated !== cond) childChanged = true
        nextConds.push(updated)
      }

      // insert new OR group after encountering the target group path
      if (cond.id === groupId && lifted) {
        nextConds.push(createEmptyGroup('or', lifted))
        childChanged = true
      }
    }

    if (childChanged) {
      rootChanged = true
      return { ...group, conditions: nextConds }
    }
    return group
  }

  const next = model.map((root) => recurse(root)).filter(Boolean) as SnConditionModel
  if (next.length !== model.length) {
    rootChanged = true
    return [next.length ? next : createEmptyModel(), true]
  }
  return [rootChanged ? next : model, rootChanged]
}

/** Delete a condition; clean and merge as before, but share refs when no change. */
function deleteFromGroup(
  group: SnConditionGroup,
  groupId: string,
  condId: string
): SnConditionGroup | null {
  if (group.id === groupId) {
    const newConditions = group.conditions.filter((c) => !(c.type === 'condition' && c.id === condId))
    if (newConditions.length === 0) return null
    if (newConditions.length !== group.conditions.length) {
      return { ...group, conditions: newConditions }
    }
    return group
  }

  let childChanged = false
  const newConditions: SnConditionGroup['conditions'] = []

  for (const c of group.conditions) {
    if (c.type === 'condition') {
      newConditions.push(c)
    } else {
      const updated = deleteFromGroup(c, groupId, condId)
      if (updated) {
        if (updated !== c) childChanged = true
        newConditions.push(updated)
      } else {
        // subtree removed
        childChanged = true
      }
    }
  }

  if (!newConditions.length) return null

  // Convert OR to AND if only one child remains
  let cleaned = newConditions
  if (cleaned.length === 1 && cleaned[0].type !== 'condition' && cleaned[0].type === 'or') {
    cleaned = [{ ...cleaned[0], type: 'and' }]
    childChanged = true
  }

  // Merge touching AND groups
  const merged: SnConditionGroup['conditions'] = []
  for (let i = 0; i < cleaned.length; i++) {
    const cur = cleaned[i]
    if (cur.type !== 'condition' && cur.type === 'and' && merged.length > 0) {
      const prev = merged[merged.length - 1]
      if (prev.type !== 'condition' && prev.type === 'and') {
        merged.pop()
        merged.push({
          ...prev,
          conditions: [...prev.conditions, ...cur.conditions],
        })
        childChanged = true
        continue
      }
    }
    merged.push(cur)
  }

  if (!childChanged) return group
  return { ...group, conditions: merged }
}

export function truncateConditionModelAtIndex(
  model: SnConditionModel,
  targetGroupIndex: number,
  targetConditionIndex: number
): SnConditionModel {
  const result: SnConditionModel = []

  function pruneGroup(
    conditions: SnConditionNode[],
    targetIndex: number,
    state: { count: number; done: boolean }
  ): SnConditionNode[] {
    const pruned: SnConditionNode[] = []

    for (const node of conditions) {
      if (state.done) break

      if (node.type === 'condition') {
        if (state.count <= targetIndex) {
          pruned.push(node)
        }
        if (state.count === targetIndex) {
          state.done = true
        }
        state.count++
      } else {
        const child = pruneGroup(node.conditions, targetIndex, state)
        if (child.length > 0) {
          pruned.push({ ...node, conditions: child })
        }
      }
    }

    return pruned
  }

  for (let i = 0; i < model.length; i++) {
    if (i < targetGroupIndex) {
      result.push(model[i])
    } else if (i === targetGroupIndex) {
      const state = { count: 0, done: false }
      const pruned = pruneGroup(model[i].conditions, targetConditionIndex, state)
      if (pruned.length > 0) {
        result.push({ ...model[i], conditions: pruned })
      }
      break
    } else {
      break
    }
  }

  return result
}

export function serializeConditionModel(model: SnConditionModel, strict = true): string | null {
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
  if (strict && invalidConditions.length > 0) return null

  function serializeGroup(group: SnConditionNode): string {
    if (group.type === 'condition') return `${group.field}${group.operator}${group.value}`
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
    setModel((prev) => {
      let changed = false
      const next = prev.map((g) => {
        const u = updateGroupPartial(g, groupId, condId, partial)
        if (u !== g) changed = true
        return u
      })
      return changed ? next : prev
    })
  }, [])

  const deleteCondition = useCallback((groupId: string, condId: string) => {
    setModel((prev) => {
      let changed = false
      const updated = prev
        .map((g) => {
          const u = deleteFromGroup(g, groupId, condId)
          if (u !== g) changed = true
          return u
        })
        .filter(Boolean) as SnConditionModel

      if (!updated.length) {
        changed = true
        return createEmptyModel()
      }
      return changed ? updated : prev
    })
  }, [])

  const updateModel = useCallback((groupId: string, type: SnAddConditionType, condId?: string) => {
    setModel((prev) => {
      if (type === 'add') {
        const [next, changed] = addConditionToGroup(groupId, prev)
        return changed ? next : prev
      }
      if (type === 'new') {
        const [next, changed] = appendAndConditionNear(groupId, prev)
        return changed ? next : prev
      }
      if (type === 'split' && condId) {
        const [next, changed] = splitConditionToOrGroup(groupId, condId, prev)
        return changed ? next : prev
      }
      return prev
    })
  }, [])

  const adjustByIndex = useCallback((gIndex: number, cIndex: number) => {
    const newModel = truncateConditionModelAtIndex(model, gIndex, cIndex)
    // Only set if something actually changed (length or reference change on root)
    const changed =
      newModel.length !== model.length ||
      newModel.some((g, i) => g !== model[i])
    if (changed) setModel(newModel)
    return changed ? newModel : model
  }, [model])

  const executeQuery = useCallback((customModel?: SnConditionModel) => serializeConditionModel(customModel || model), [model])
  const addGroup = useCallback(() => {
    setModel((prev) => [...prev, ...createEmptyModel()])
  }, [])
  const clearQuery = useCallback(() => {
    const newModel = createEmptyModel()
    setModel(newModel)
    return newModel
  }, [])

  return {
    model,
    updateCondition,
    deleteCondition,
    updateModel,
    executeQuery,
    clearQuery,
    addGroup,
    adjustByIndex,
  }
}
