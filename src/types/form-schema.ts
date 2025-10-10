import { boolean, z } from 'zod'
import { SnRow } from './table-schema'
import { _GlideUserSchema } from './client-scripts'
import { Options as PrettierOptions } from 'prettier'
import { ControllerRenderProps } from 'react-hook-form'
import { getAllPredicates } from '@kit/types/predicate-definitions'

//UI Actions
const _action = z.object({
  action_name: z.string(),
  form_style: z.string(),
  is_button: z.boolean(),
  is_context: z.boolean(),
  is_link: z.boolean(),
  name: z.string(),
  primary: z.boolean(),
  sys_id: z.string(),
})

const _uiResponse = z.object({
  isInsert: z.boolean(),
  isActionAborted: z.boolean(),
  sys_id: z.string(),
  $$uiNotification: z
    .array(
      z.object({
        type: z.string(),
        message: z.string(),
      })
    )
    .optional(),
})
export type SnUiAction = z.infer<typeof _action>
export type SnUiResponse = z.infer<typeof _uiResponse>
export type UiActionHandler = (a: SnUiAction) => Promise<void>


//Client Scripts
const _clientScript = z.object({
  name: z.string(),
  type: z.enum(['onLoad', 'onChange', 'onSubmit']),
  script: z.string(),
  fieldName: z.string(),
  tableName: z.string(),
  sys_id: z.string(),
})
export type SnClientScript = z.infer<typeof _clientScript>

//UI Policies
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
  dotWalkedValue: z.string().optional(),
})

const _policyScript = z.object({
  name: z.string(),
  script: z.string(),
})

const _policy = z.object({
  short_description: z.string(),
  sys_id: z.string(),
  reverse: z.boolean(),
  onload: z.boolean(),
  is_run_scripts: z.boolean(),
  script_true: _policyScript.optional(),
  script_false: _policyScript.optional(),
  conditions: z.array(_policyCondition),
  actions: z.array(_policyAction),
})

export type SnPolicyScript = z.infer<typeof _policyScript>
export type SnPolicyAction = z.infer<typeof _policyAction>
export type SnPolicyCondition = z.infer<typeof _policyCondition>
export type SnPolicy = z.infer<typeof _policy>

// Reference Fields
const _recordPickerItem = z.object({
  display_value: z.string(),
  value: z.string(),
  primary: z.string().optional(),
  secondary: z.string().optional(),
  meta: z.custom<SnRow>().optional(),
})

const _attributes = z.object({
  ref_ac_columns: z.string().optional(),
  ref_ac_order_by: z.string().optional(),
  ref_ac_table: z.string().optional(),
  ref_ac_display_value: z.string().optional(),
})

const _ed = z.object({
  reference: z.string(),
  qualifier: z.string(),
  dependent_value: z.string().optional(),
  defaultOperator: z.string().optional(),
  searchField: z.string().optional(),
})

export const pickerList = z.record(_recordPickerItem)
export type SnRecordPickerItem = z.infer<typeof _recordPickerItem>
export type SnRecordPickerList = SnRecordPickerItem[]
export type SnRefFieldEd = z.infer<typeof _ed>

//Activity Formatter
const _entrySchema = z.object({
  sys_created_on_adjusted: z.string(),
  sys_id: z.string(),
  login_name: z.string(),
  user_sys_id: z.string(),
  initials: z.string(),
  sys_created_on: z.string(),
  contains_code: z.union([z.string(), z.boolean()]),
  field_label: z.string(),
  is_truncated: z.boolean(),
  name: z.string(),
  value: z.string(),
  element: z.string(),
  user_img: z.string().optional(),
})

const _journalFieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  color: z.string().optional(),
  can_read: z.boolean().optional(),
  can_write: z.boolean().optional(),
  canWrite: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isJournal: z.boolean().optional(),
})

const _activitySchema = z.object({
  display_value: z.string(),
  sys_id: z.string(),
  entries: z.array(_entrySchema),
  user_sys_id: z.string(),
  user_full_name: z.string(),
  user_login: z.string(),
  label: z.string(),
  table: z.string(),
  journal_fields: z.array(_journalFieldSchema),
  readable: z.array(z.string()),
  writeable: z.array(z.string()),
  formatter: z.string(),
})

const _snBaseEntry = z.object({
  initials: z.string(),
  user_id: z.string(),
  user_image: z.string().optional(),
  sys_created_on: z.string(),
  sys_timestamp: z.number(),
  sys_created_by: z.string(),
  entries: z.object({
    changes: z.array(z.unknown()),
    custom: z.array(z.unknown()),
    journal: z.array(
      z.object({
        allow_code_tag: z.boolean(),
        field_label: z.string(),
        change_type: z.string(),
        field_name: z.string(),
        sys_id: z.string(),
        sanitized_old_value: z.string(),
        contains_code: z.boolean(),
        is_truncated: z.boolean(),
        is_translation_enabled: z.boolean(),
        old_value: z.string(),
        field_type: z.string(),
        new_value: z.string(),
        sanitized_new_value: z.string(),
      })
    ),
  }),
})

const _snBaseActivity = z.object({
  display_value: z.string(),
  entries: z.array(_snBaseEntry),
  fields: z.array(_journalFieldSchema),
  primary_fields: z.string().array().optional(),
  sys_timestamp: z.number(),
})

export type SnBaseEntry = z.infer<typeof _snBaseEntry>
export type SnBaseActivity = z.infer<typeof _snBaseActivity>
export type SnJournalField = z.infer<typeof _journalFieldSchema>
export type SnActivityEntry = z.infer<typeof _entrySchema>
export type SnActivity = z.infer<typeof _activitySchema>
export type EntryFields = {
  name: string
  label: string
}
//General Form and Fields
const _currencyCode = z.object({
  code: z.string(),
  symbol: z.string(),
})

const _fieldChoiceItem = z.object({
  name: z.string().optional(),
  label: z.string(),
  type: z.string().optional(),
  display: boolean().optional(),
  value: z.string(),
})

const _formConfig = z.object({
  user: z.string(),
  date_format: z.string(),
  base_url: z.string(),
  scope: z.string(),
  glide_user: _GlideUserSchema,
  prettier: z.custom<PrettierOptions>(),
  es_lint: z.record(z.any()).optional(),
  security: z.object({
    canWrite: z.boolean(),
    canRead: z.boolean(),
    canDelete: z.boolean().optional(),
  }),
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
  attributes: _attributes.optional(),
  currencyCode: z.string().optional(),
  currencyValue: z.string().optional(),
  currencyCodes: _currencyCode.array().optional(),
  dependentField: z.string().optional(),
  choices: z.array(_fieldChoiceItem).optional(),
  journalInputChanged: z.boolean().optional(),
})

const _currencyField = z.object({
  label: z.string(),
  currencyCode: z.string(),
  currencyValue: z.string().optional(),
  currencyCodes: _currencyCode.array(),
})

export type SnFieldPrimitive = string | string[] | boolean | number
export type SnFieldSchema = z.infer<typeof _formField>
export type SnFieldsSchema = Record<string, SnFieldSchema>
export type SnFieldChoiceItem = z.infer<typeof _fieldChoiceItem>
export type SnFormConfig = z.infer<typeof _formConfig>
export type FormData = Record<string, string | boolean | number | null>
export type RHFField = ControllerRenderProps<FormData, string>
export type SnCurrencyField = z.infer<typeof _currencyField>

export type SnFormApis = {
  formData: string
  refDisplay?: string
}

export type FieldUIState = {
  mandatory: boolean
  visible: boolean
  readonly: boolean
}

export interface SnFieldBaseProps<T> {
  rhfField: RHFField
  onChange: (val: T, display?: string) => void
  field?: SnFieldSchema
}

export type SnSectionField = { name: string; type: string }
export type SnSectionColumn = { fields: SnSectionField[] }
export type SnSection = {
  id: string
  visible: boolean
  caption?: string
  captionDisplay?: string
  _parent?: string
  _bootstrap_cells: number
  columns: SnSectionColumn[]
}
