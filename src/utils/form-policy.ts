/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from 'date-fns'
import { FieldUIState, SnFieldsSchema, SnFormConfig, SnPolicy, SnPolicyCondition } from '@kit/types/form-schema'

function groupConditions(conditions: SnPolicyCondition[]): SnPolicyCondition[][] {
  const groups: SnPolicyCondition[][] = []
  let currentGroup: SnPolicyCondition[] = []

  for (const cond of conditions) {
    if (cond.newquery && currentGroup.length > 0) {
      groups.push(currentGroup)
      currentGroup = []
    }
    currentGroup.push(cond)
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
}

function evaluateCondition(cond: SnPolicyCondition, formData: Record<string, any>, formConfig: SnFormConfig): boolean {
  const fieldVal = formData[cond.field]
  const condVal = cond.value

  switch (cond.oper) {
    case '=':
      return String(fieldVal) === String(condVal)
    case '!=':
      return String(fieldVal) !== String(condVal)
    case 'IN':
      return condVal.split(',').includes(String(fieldVal))
    case 'NOT IN':
      return !condVal.split(',').includes(String(fieldVal))
    case 'LIKE':
      return String(fieldVal).toLowerCase().includes(String(condVal).toLowerCase())
    case 'NOT LIKE':
      return !String(fieldVal).toLowerCase().includes(String(condVal).toLowerCase())
    case 'STARTSWITH':
      return String(fieldVal).startsWith(condVal)
    case 'ENDSWITH':
      return String(fieldVal).endsWith(condVal)
    case 'ISEMPTY':
      return fieldVal === '' || fieldVal === null || fieldVal === undefined
    case 'ISNOTEMPTY':
      return !(fieldVal === '' || fieldVal === null || fieldVal === undefined)
    case 'EMPTYSTRING':
      return String(fieldVal).trim() === ''
    case '<=':
      return Number(fieldVal) <= Number(condVal)
    case '>=':
      return Number(fieldVal) >= Number(condVal)
    case 'BETWEEN': {
      const [min, max] = condVal.split(',').map(Number)
      const val = Number(fieldVal)
      return val >= min && val <= max
    }
    case 'MATCH_PAT': {
      const escapedPattern = condVal.replace(/\*/g, '.*') // Convert '*' to '.*'
      const regex = new RegExp(`^${escapedPattern}$`, 'i')
      return regex.test(String(fieldVal))
    }
    case 'MATCH_RGX': {
      try {
        const regex = new RegExp(condVal)
        return regex.test(String(fieldVal))
      } catch {
        return false
      }
    }
    case 'ANYTHING':
      return fieldVal !== null && fieldVal !== undefined && String(fieldVal).trim() !== ''
    case 'SAMEAS':
    case 'NSAMEAS': {
      const compareVal = formData[condVal]
      return cond.oper === 'SAMEAS' ? fieldVal === compareVal : fieldVal !== compareVal
    }
    case 'ON': {
      const parts = condVal.split('@')
      if (parts.length < 3) return false

      const [, startStr, endStr] = parts
      const userFormat = formConfig.date_format + ' HH:mm:ss'
      const utcFormat = fieldVal.length > 10 ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd'

      try {
        const start = parse(startStr, userFormat, new Date())
        const end = parse(endStr, userFormat, new Date())
        const dateVal = parse(fieldVal, utcFormat, new Date())
        return dateVal >= start && dateVal <= end
      } catch {
        return false
      }
    }
    default:
      console.warn(`Unsupported operator: ${cond.oper}`)
      return false
  }
}

function evaluateGroup(group: SnPolicyCondition[], formData: Record<string, any>, formConfig: SnFormConfig): boolean {
  if (group.length === 0) return true

  let result = evaluateCondition(group[0], formData, formConfig)

  for (let i = 1; i < group.length; i++) {
    const cond = group[i]
    const evalResult = evaluateCondition(cond, formData, formConfig)

    result = cond.or ? result || evalResult : result && evalResult
  }

  return result
}

export function evaluatePolicy(
  policy: SnPolicy,
  formData: Record<string, any>,
  _formFields: SnFieldsSchema,
  formConfig: SnFormConfig
): boolean {
  const groups = groupConditions(policy.conditions)
  return groups.some(group => evaluateGroup(group, formData, formConfig))
}

export function evaluateAndApplyPolicy(
  form: any,
  formFields: SnFieldsSchema,
  policy: SnPolicy,
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void,
  formConfig: SnFormConfig
) {
  console.log('Evaluating policy:', policy)
  const formData = form.getValues()
  const result = evaluatePolicy(policy, formData, formFields, formConfig)

  policy.actions.forEach(action => {
    const { name: field, visible, mandatory, disabled } = action
    const reverse = policy.reverse && !result

    const applyValue = (val: string, reverse: boolean) =>
      val === 'ignore' ? undefined : reverse ? val !== 'true' : val === 'true'

    const uiUpdate: Partial<FieldUIState> = {}
    const vis = applyValue(visible, reverse)
    const mand = applyValue(mandatory, reverse)
    const ro = applyValue(disabled, reverse)

    if (vis !== undefined) uiUpdate.visible = vis
    if (mand !== undefined) uiUpdate.mandatory = mand
    if (ro !== undefined) uiUpdate.readonly = ro

    if (Object.keys(uiUpdate).length > 0) {
      updateFieldUI(field, uiUpdate)
    }
  })
}
