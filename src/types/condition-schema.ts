export type SnFieldOperator = {
  operator: string
  label: string
  advancedEditor: string
  editor: string
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
  choices?: SnFieldChoice[]
  operators: SnFieldOperator[]
  qualifier?: string
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

export type SnTableMetadata = {
  table: string
  fields: SnConditionMap
}
