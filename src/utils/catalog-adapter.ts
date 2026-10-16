import type {
  SnCatalogClientScriptSchema,
  SnCatalogItemSchema,
  SnCatalogNormalizedItem,
  SnCatalogPolicySchema,
  SnCatalogVariableSchema,
  SnCatalogVariableValue,
  SnCatalogVariables,
} from '@kit/types/catalog-schema'
import type {
  SnClientScript,
  SnFieldChoiceItem,
  SnFieldSchema,
  SnFieldsSchema,
  SnPolicy,
  SnPolicyAction,
  SnPolicyCondition,
  SnPolicyScript,
} from '@kit/types/form-schema'
import { toSafe } from '@kit/components/sn-form/hooks/useDotSafeForm'

const SUPPORTED_VARIABLE_TYPES = new Set(['string', 'textarea', 'choice', 'boolean', 'reference'])

const toBoolean = (value: unknown, fallback = false) => {
  if (value === undefined || value === null) return fallback
  if (value === true || value === 1) return true
  return typeof value === 'string' && ['true', '1'].includes(value.toLowerCase())
}

const asString = (value: unknown) => (value === undefined || value === null ? '' : String(value))

function normalizeAttributes(attributes: SnCatalogVariableSchema['attributes']): SnFieldSchema['attributes'] {
  if (!attributes) return undefined
  if (typeof attributes === 'object') return attributes as SnFieldSchema['attributes']

  const parsed: Record<string, string> = {}
  for (const token of attributes.split(',')) {
    const separator = token.indexOf('=')
    if (separator === -1) continue
    const key = token.slice(0, separator).trim()
    const value = token.slice(separator + 1).trim()
    if (key) parsed[key] = value
  }

  return parsed as SnFieldSchema['attributes']
}

function normalizeChoices(choices?: SnCatalogVariableSchema['choices']): SnFieldChoiceItem[] | undefined {
  if (!choices) return undefined
  return choices.map(choice => ({
    label: asString(choice.label),
    value: asString(choice.value),
  }))
}

function normalizeVariable(key: string, variable: SnCatalogVariableSchema): SnFieldSchema | null {
  const type = asString(variable.type)
  if (!SUPPORTED_VARIABLE_TYPES.has(type)) return null

  const name = variable.name || key
  const value = variable.value ?? variable.stagedValue ?? ''
  const reference = variable.ed?.reference || variable.refTable || ''

  return {
    name,
    label: variable.label || name,
    hint: variable.hint || variable.instructions || variable.help_text || undefined,
    hintLabel: variable.help_tag || undefined,
    hintExpanded: toBoolean(variable.expand_help),
    value: asString(value),
    displayValue: variable.displayValue ?? variable.display_value ?? asString(value),
    mandatory: toBoolean(variable.mandatory ?? variable._mandatory),
    visible: toBoolean(variable.visible ?? variable._visible, true),
    readonly: toBoolean(variable.readonly ?? variable.read_only ?? variable._readonly),
    sys_readonly: toBoolean(variable.sys_readonly),
    type,
    max_length: typeof variable.max_length === 'number' ? variable.max_length : undefined,
    choice: normalizeChoices(variable.choices)?.length ? 1 : 0,
    choices: normalizeChoices(variable.choices),
    attributes: normalizeAttributes(variable.attributes),
    dependentField: variable.dependentField,
    ed:
      type === 'reference'
        ? {
            reference,
            qualifier: variable.ed?.qualifier || variable.reference_qual || '',
            dependent_value: variable.ed?.dependent_value,
            defaultOperator: variable.ed?.defaultOperator,
            searchField: variable.ed?.searchField,
          }
        : undefined,
  }
}

function buildAliasMap(item: SnCatalogItemSchema): Record<string, string> {
  const aliases: Record<string, string> = {}

  for (const [key, variable] of Object.entries(item._fields || {})) {
    const canonical = variable.name || key
    const candidates = [
      key,
      canonical,
      variable.sys_id,
      variable.sys_id ? `IO:${variable.sys_id}` : undefined,
      variable.variable_name,
      variable.catalogFieldName,
    ]

    for (const alias of candidates) {
      if (alias) aliases[alias] = canonical
    }
  }

  return aliases
}

const normalizeActionValue = (value: unknown): SnPolicyAction['visible'] => {
  if (value === 'true' || value === true) return 'true'
  if (value === 'false' || value === false) return 'false'
  return 'ignore'
}

function normalizePolicyScript(
  script: SnCatalogPolicySchema['script_true'] | SnCatalogPolicySchema['script_false'],
  fallbackName: string
): SnPolicyScript | undefined {
  if (!script?.script) return undefined
  return { name: script.name || fallbackName, script: script.script }
}

function toSchemaList<T>(source: unknown, isEntry: (value: Record<string, unknown>) => boolean): T[] {
  if (Array.isArray(source)) return source.flatMap(value => toSchemaList<T>(value, isEntry))
  if (!source || typeof source !== 'object') return []

  const value = source as Record<string, unknown>
  if (isEntry(value)) return [value as T]
  return Object.values(value).flatMap(entry => toSchemaList<T>(entry, isEntry))
}

const toPolicyList = (source: unknown) =>
  toSchemaList<SnCatalogPolicySchema>(source, value =>
    ['conditions', 'actions', 'sys_id', 'short_description'].some(key => key in value)
  )

const toConditionList = (source: unknown) =>
  toSchemaList<NonNullable<SnCatalogPolicySchema['conditions']>[number]>(source, value =>
    ['field', 'catalog_variable', 'variable_name', 'oper', 'term'].some(key => key in value)
  )

const toActionList = (source: unknown) =>
  toSchemaList<NonNullable<SnCatalogPolicySchema['actions']>[number]>(source, value =>
    ['name', 'field', 'field_name', 'catalog_variable', 'variable_name', 'visible', 'mandatory'].some(
      key => key in value
    )
  )

function resolvePolicyFieldName(
  rawField: string,
  aliases: Record<string, string>,
  term?: unknown
) {
  if (rawField) {
    const withoutVariablePrefix = rawField.replace(/^variables\./, '')
    return aliases[rawField] || aliases[withoutVariablePrefix] || withoutVariablePrefix
  }

  const termField = typeof term === 'string' ? term.match(/(?:^|\^)variables\.([^=^!<>]+)/)?.[1] : undefined
  return termField ? aliases[termField] || termField : ''
}

function normalizePolicies(policies: SnCatalogPolicySchema[], aliases: Record<string, string>): SnPolicy[] {
  return policies.map((policy, policyIndex) => {
    const conditions: SnPolicyCondition[] = toConditionList(policy.conditions).map(condition => {
      const rawField = condition.field || condition.catalog_variable || condition.variable_name || ''
      return {
        field: resolvePolicyFieldName(rawField, aliases, condition.term),
        oper: (condition.oper || '=') as SnPolicyCondition['oper'],
        value: asString(condition.value),
        type: condition.type || 'string',
        or: toBoolean(condition.or),
        newquery: toBoolean(condition.newquery),
        dotWalkedValue: condition.dotWalkedValue,
      }
    })

    const actions: SnPolicyAction[] = toActionList(policy.actions).map(action => {
      const rawName =
        action.name ||
        action.field ||
        action.field_name ||
        action.catalog_variable ||
        action.variable_name ||
        ''
      return {
        name: resolvePolicyFieldName(rawName, aliases),
        visible: normalizeActionValue(action.visible),
        mandatory: normalizeActionValue(action.mandatory),
        disabled: normalizeActionValue(action.disabled),
      }
    })

    return {
      short_description: policy.short_description || `Catalog policy ${policyIndex + 1}`,
      sys_id: policy.sys_id || `catalog-policy-${policyIndex}`,
      reverse: toBoolean(policy.reverse),
      onload: toBoolean(policy.onload ?? policy.onLoad),
      is_run_scripts: toBoolean(policy.is_run_scripts ?? policy.runScripts),
      script_true: normalizePolicyScript(policy.script_true, 'Catalog policy true script'),
      script_false: normalizePolicyScript(policy.script_false, 'Catalog policy false script'),
      conditions,
      actions,
    }
  })
}

function normalizeClientScript(
  script: SnCatalogClientScriptSchema,
  type: SnClientScript['type'],
  index: number,
  aliases: Record<string, string>
): SnClientScript | null {
  if (!script.script) return null
  const rawFieldName = script.fieldName || ''
  return {
    name: script.name || `Catalog ${type} script ${index + 1}`,
    type,
    script: script.script,
    fieldName: aliases[rawFieldName] || rawFieldName,
    tableName: script.tableName || '',
    sys_id: script.sys_id || `catalog-${type}-${index}`,
  }
}

function normalizeClientScripts(item: SnCatalogItemSchema, aliases: Record<string, string>): SnClientScript[] {
  const source = item.client_script || {}
  const result: SnClientScript[] = []
  const types: SnClientScript['type'][] = ['onChange', 'onSubmit', 'onLoad']

  for (const type of types) {
    const scripts = source[type]
    if (!Array.isArray(scripts)) continue
    scripts.forEach((script, index) => {
      const normalized = normalizeClientScript(script, type, index, aliases)
      if (normalized) result.push(normalized)
    })
  }

  return result
}

export function normalizeCatalogItem(item: SnCatalogItemSchema): SnCatalogNormalizedItem {
  const aliases = buildAliasMap(item)
  const fields: SnFieldsSchema = {}

  for (const [key, variable] of Object.entries(item._fields || {})) {
    const field = normalizeVariable(key, variable)
    if (field) fields[field.name] = field
  }

  const policySources = [item.policy, item.ui_policy, item.policies, item.uiPolicies]
  const catalogPolicies = policySources.map(toPolicyList).find(source => source.length > 0) || []

  return {
    item,
    fields,
    aliases,
    sections: item._sections || [],
    clientScripts: normalizeClientScripts(item, aliases),
    policies: normalizePolicies(catalogPolicies, aliases),
    messages: item.client_script?.messages || {},
  }
}

export function resolveCatalogVariableName(aliases: Record<string, string>, fieldName: string): string {
  return aliases[fieldName] || fieldName
}

export function serializeCatalogVariables(
  fields: SnFieldsSchema,
  values: Record<string, SnCatalogVariableValue>
): SnCatalogVariables {
  return Object.fromEntries(
    Object.values(fields).map(field => {
      const value = values[field.name] ?? values[toSafe(field.name)]
      let serialized = ''

      if (Array.isArray(value)) serialized = value.join(',')
      else if (typeof value === 'boolean') serialized = value ? 'true' : 'false'
      else if (value !== null && value !== undefined) serialized = String(value)

      return [field.name, serialized]
    })
  )
}
