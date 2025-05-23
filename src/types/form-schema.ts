import { boolean, z } from 'zod'
import { SnRow } from './table-schema'
import { ControllerRenderProps } from 'react-hook-form'
import { getAllPredicates } from '@kit/types/predicate-definitions'

const _formConfig = z.object({
  date_format: z.string(),
  base_url: z.string(),
  security: z.object({
    canWrite: z.boolean(),
    canRead: z.boolean(),
    canDelete: z.boolean().optional(),
  })
})

const _recordPickerItem = z.object({
  display_value: z.string(),
  value: z.string(),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  meta: z.custom<SnRow>().optional(),
})

const _action = z.object({
  action_name: z.string(),
  form_style: z.string(),
  is_button: z.boolean(),
  is_contextual: z.boolean(),
  is_link: z.boolean(),
  name: z.string(),
  primary: z.boolean(),
  sys_id: z.string(),
})

const _clientScript = z.object({
  name: z.string(),
  type: z.enum(['onLoad', 'onChange', 'onSubmit']),
  script: z.string(),
  fieldName: z.string(),
  tableName: z.string(),
  sys_id: z.string(),
})

const _ed = z.object({
  reference: z.string(),
  qualifier: z.string(),
  dependent_value: z.string().optional(),
  defaultOperator: z.string().optional(),
  searchField: z.string().optional(),
  attributes: z.object({
    ref_ac_columns: z.string().optional(),
    ref_ac_order_by: z.string().optional(),
    ref_ac_table: z.string().optional(),
    ref_ac_display_value: z.string().optional(),
  }),
})

const _currencyCode = z.object({
  code: z.string(),
  symbol: z.string(),
})

const _fieldChoiceItem = z.object({
  name: z.string(),
  label: z.string(),
  type: z.string(),
  display: boolean(),
  value: z.string(),
})

const _formField = z.object({
  name: z.string(),
  label: z.string(),
  value: z.string(),
  displayValue: z.string(),
  mandatory: z.boolean(),
  visible: z.boolean(),
  readonly: z.boolean(),
  staged_data: z.record(z.any()).optional(),
  sys_readonly: z.boolean().optional(),
  sys_mandatory: z.boolean().optional(),
  type: z.string(), //z.enum(['string', 'choice', 'glide_date', 'glide_date_time', 'reference', 'boolean']),
  max_length: z.number().optional(),
  choice: z.number().optional(),
  ed: _ed.optional(),
  currencyCode: z.string().optional(),
  currencyValue: z.string().optional(),
  currencyCodes: _currencyCode.array().optional(),
  dependentField: z.string().optional(),
  choices: z.array(_fieldChoiceItem).optional(),
})

const actionEnum = ['true', 'false', 'ignore'] as const

const _policyAction = z.object({
  name: z.string(),
  mandatory: z.enum(actionEnum),
  visible: z.enum(actionEnum),
  disabled: z.enum(actionEnum),
})

const _policyCondition = z.object({
  or: z.boolean(),
  field: z.string(),
  oper: z.enum(getAllPredicates() as [string, ...string[]]),
  value: z.string(),
  newquery: z.boolean(),
  type: z.string(),
})

const _policy = z.object({
  short_description: z.string(),
  sys_id: z.string(),
  reverse: z.boolean(),
  onload: z.boolean(),
  conditions: z.array(_policyCondition),
  actions: z.array(_policyAction),
})

export const pickerList = z.record(_recordPickerItem)
export type SnUiAction = z.infer<typeof _action>
export type SnFieldSchema = z.infer<typeof _formField>
export type SnClientScript = z.infer<typeof _clientScript>
export type SnPolicyAction = z.infer<typeof _policyAction>
export type SnPolicyCondition = z.infer<typeof _policyCondition>
export type SnPolicy = z.infer<typeof _policy>
export type SnFieldsSchema = Record<string, SnFieldSchema>
export type SnRecordPickerItem = z.infer<typeof _recordPickerItem>
export type SnRecordPickerList = SnRecordPickerItem[]
export type SnRefFieldEd = z.infer<typeof _ed>
export type SnFieldChoiceItem = z.infer<typeof _fieldChoiceItem>
export type SnFormConfig = z.infer<typeof _formConfig>
export type FormData = Record<string, string | boolean | number | null>
export type RHFField = ControllerRenderProps<FormData, string>
export type FieldUIState = {
  mandatory: boolean
  visible: boolean
  readonly: boolean
}

export type SnFieldPrimitive = string | string[] | boolean | number

export interface SnFieldBaseProps<T> {
  rhfField: RHFField
  onChange: (val: T) => void
  field?: SnFieldSchema
}

export type SnSectionField = { name: string; type: string }
export type SnSectionColumn = { fields: SnSectionField[] }
export type SnSection = {
  id: string
  captionDisplay?: string
  _parent?: string
  _bootstrap_cells: number
  columns: SnSectionColumn[]
}

export type SnAttachment = {
  sys_id: string
  file_name: string
  content_type: string
  url: string
}

export type SnFormApis = {
  formData: string
  refDisplay?: string
}
