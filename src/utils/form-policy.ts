/* eslint-disable @typescript-eslint/no-explicit-any */
import { evaluateCondition } from '../utils/predicate-evaluator'
import {
  FieldUIState,
  SnFieldsSchema,
  SnFormConfig,
  SnPolicy,
  SnPolicyCondition,
  SnPolicyScript,
} from '@kit/types/form-schema'

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
  executePolicyScript: (script?: SnPolicyScript) => any,
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void,
  formConfig: SnFormConfig
) {
  const formData = form.getValues()
  const result = evaluatePolicy(policy, formData, formFields, formConfig)

  if (policy.is_run_scripts) {
    const _run = result ? executePolicyScript(policy.script_true) : executePolicyScript(policy.script_false)
  }

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
