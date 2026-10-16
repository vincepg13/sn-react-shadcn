import type { GlideUserSchema } from './client-scripts'
import type {
  HintDisplayType,
  SnClientScript,
  SnFieldsSchema,
  SnPolicy,
} from './form-schema'

export type SnCatalogVariableValue = string | string[] | boolean | number | null | undefined
export type SnCatalogVariables = Record<string, string>

export type SnCatalogApis = {
  itemData: string
  serviceCatalogBase?: string
  refDisplay?: string
}

export type SnCatalogFormOptions = {
  hintDisplay?: HintDisplayType
  textareaThreshold?: number
  submitLabel?: string
}

export type SnCatalogRuntimeConfig = {
  user: string
  base_url: string
  date_format: string
  scope: string
  glide_user: GlideUserSchema
  scratchpad?: Record<string, unknown>
}

export type SnCatalogChoice = {
  label: string
  value: string
  [key: string]: unknown
}

export type SnCatalogVariableSchema = {
  name?: string
  label?: string
  type?: string
  value?: SnCatalogVariableValue
  stagedValue?: SnCatalogVariableValue
  displayValue?: string
  display_value?: string
  mandatory?: boolean
  visible?: boolean
  readonly?: boolean
  read_only?: boolean
  sys_readonly?: boolean
  max_length?: number
  hint?: string
  instructions?: string
  help_tag?: string
  help_text?: string
  expand_help?: boolean | string | number
  placeholder?: string
  choices?: SnCatalogChoice[]
  attributes?: string | Record<string, unknown>
  ed?: {
    reference?: string
    qualifier?: string
    dependent_value?: string
    defaultOperator?: string
    searchField?: string
    [key: string]: unknown
  }
  refTable?: string
  reference_qual?: string
  dependentField?: string
  sys_id?: string
  variable_name?: string
  catalogFieldName?: string
  _cat_variable?: boolean | string
  _visible?: boolean
  _readonly?: boolean
  _mandatory?: boolean
  _parent?: string
  [key: string]: unknown
}

export type SnCatalogClientScriptSchema = {
  name?: string
  type?: 'onLoad' | 'onChange' | 'onSubmit'
  script?: string
  fieldName?: string
  tableName?: string
  sys_id?: string
  [key: string]: unknown
}

export type SnCatalogClientScriptsSchema = {
  onLoad?: SnCatalogClientScriptSchema[]
  onChange?: SnCatalogClientScriptSchema[]
  onSubmit?: SnCatalogClientScriptSchema[]
  messages?: Record<string, string>
  [key: string]: unknown
}

export type SnCatalogPolicyConditionSchema = {
  field?: string
  catalog_variable?: string
  variable_name?: string
  oper?: string
  value?: string
  type?: string
  or?: boolean
  newquery?: boolean
  dotWalkedValue?: string
  [key: string]: unknown
}

export type SnCatalogPolicyActionSchema = {
  name?: string
  field?: string
  field_name?: string
  catalog_variable?: string
  variable_name?: string
  mandatory?: string
  visible?: string
  disabled?: string
  [key: string]: unknown
}

export type SnCatalogPolicySchema = {
  short_description?: string
  sys_id?: string
  reverse?: boolean
  onload?: boolean
  onLoad?: boolean
  runScripts?: boolean
  is_run_scripts?: boolean
  script_true?: { name?: string; script?: string }
  script_false?: { name?: string; script?: string }
  conditions?: SnCatalogPolicyConditionSchema[]
  actions?: SnCatalogPolicyActionSchema[]
  [key: string]: unknown
}

export type SnCatalogLayoutNode = {
  name?: string
  type?: string
  caption?: string
  visible?: boolean
  layout?: string
  variables?: SnCatalogLayoutNode[]
  containers?: SnCatalogLayoutNode[]
  columns?: SnCatalogLayoutColumn[]
  [key: string]: unknown
}

export type SnCatalogLayoutColumn = {
  fields?: SnCatalogLayoutNode[]
  [key: string]: unknown
}

export type SnCatalogSectionSchema = SnCatalogLayoutNode & {
  id?: string
  columns?: SnCatalogLayoutColumn[]
  _bootstrap_cells?: number
  _count?: number
}

export type SnCatalogItemSchema = {
  sys_id: string
  sys_class_name: string
  name?: string
  short_description?: string
  description?: unknown
  target_table_name?: string
  mandatory_attachment?: boolean
  no_attachments?: boolean
  _attachmentGUID?: string
  _fields: Record<string, SnCatalogVariableSchema>
  _sections?: SnCatalogSectionSchema[]
  _view?: SnCatalogLayoutNode[]
  client_script?: SnCatalogClientScriptsSchema
  policy?: SnCatalogPolicySchema[]
  ui_policy?: SnCatalogPolicySchema[]
  policies?: SnCatalogPolicySchema[] | Record<string, SnCatalogPolicySchema>
  uiPolicies?: SnCatalogPolicySchema[] | Record<string, SnCatalogPolicySchema>
  g_scratchpad?: Record<string, unknown>
  [key: string]: unknown
}

export type SnCatalogMetadata = {
  item: SnCatalogItemSchema
  runtime: SnCatalogRuntimeConfig
}

export type SnCatalogNormalizedItem = {
  item: SnCatalogItemSchema
  fields: SnFieldsSchema
  aliases: Record<string, string>
  sections: SnCatalogSectionSchema[]
  clientScripts: SnClientScript[]
  policies: SnPolicy[]
  messages: Record<string, string>
}

export type SnCatalogSubmissionResult = {
  sysId: string
  table: string
  number?: string
  recordPath?: string
  parentId?: string | null
  parentTable?: string | null
  redirectUrl?: string
  redirectPortalUrl?: string
  redirectTo?: string
}

export type SnCatalogSubmitFunction = (
  variables: SnCatalogVariables
) => Promise<SnCatalogSubmissionResult>
