export type SnValueChoiceItem = {
  label: string
  value: string
}

export type SnFieldCurrencyChoice = {
  symbol: string
  code: string
  name?: string
  description?: string
  default?: boolean
}

export type SnFieldOperator = {
  operator: string
  label: string
  advancedEditor: string
  editor: string
  betweenType?: string
}

export type SnFieldChoice = {
  label: string
  value: string
}

export type SnConditionField = {
  name: string
  label: string
  type: string
  reference?: string
  referenceDisplayField?: string
  referenceKey?: string
  referenceCols?: string[]
  choices?: SnFieldChoice[]
  operators: SnFieldOperator[]
  qualifier?: string
}

export type SnConditionRefField = {
  field: string,
  field_label: string,
  internal_type: string,
  reference_table: string,
}

export type SnConditionRow = {
  id: string
  type: 'condition'
  field: string
  operator: string
  value: string
  fieldLabel?: string
  operatorLabel?: string
  displayValue?: string
  fieldType?: string
  table?: string
  references?: SnConditionRefField[]
  term?: string
  termLabel?: string
}

export type SnConditionGroup = {
  id: string
  type: 'and' | 'or'
  conditions: SnConditionNode[]
}

export type SnConditionNode = SnConditionRow | SnConditionGroup
export type SnConditionModel = SnConditionGroup[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SnConditionsApiResult = Record<string, any>;
export type SnConditionMap = Record<string, SnConditionField>
export type SnConditionDisplayItem = {display: string, id: string, or?: boolean }
export type SnConditionDisplayArray = SnConditionDisplayItem[][]

export type SnTableMetadata = {
  table: string
  fields: SnConditionMap
}

export type DateMetaArray = [string, string][]
export interface SnDateTimeMeta {
  timeAgoDates: Record<
    string,
    {
      label: string
      after: string
      before: string
      between: string
    }
  >
  relativeOperators: [string, string][]
  relativeDurations: [string, string][]
  relativeTypes: [string, string][]
  comparativeDurations: [string, string][]
  comparativeTypes: [string, string][]
  equivalentDurations: [string, string][]
  trendValuesWithFieldsPlural: [string, string][]
  dateChoiceModel: {label: string; value: string}[]
  dateChoiceBetweenDisplayValues: {
    label: string
    values: { label: string; value: string }[]
    type: string
  }[]
}