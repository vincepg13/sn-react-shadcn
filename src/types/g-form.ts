import type {
  SnDecorationIcon,
  SnFieldPrimitive,
  SnFormValues,
  SnUiAction,
} from './form-schema'

export type SnGFormReference = Record<string, string>

export interface SnGForm {
  getViewName(): string
  getTableName(): string | undefined
  getSysId(): string
  getUniqueValue(): string
  isNewRecord(): boolean

  hasField(fieldName: string): boolean
  getFieldNames(): string[]

  getDisplayValue(fieldName: string): string
  getValue(fieldName: string): string
  getIntValue(fieldName: string): number | undefined
  getDecimalValue(fieldName: string): number | undefined
  getBooleanValue(fieldName: string): boolean
  setValue(fieldName: string, value: SnFieldPrimitive, displayValue?: string): void
  clearValue(fieldName: string): void

  getLabel(fieldName: string): string
  getLabelOf(fieldName: string): string
  setLabel(fieldName: string, label: string): void
  setLabelOf(fieldName: string, label: string): void

  getSectionNames(): string[]
  setSectionDisplay(sectionName: string, state: boolean): void

  isMandatory(fieldName: string): boolean
  setDisabled(fieldName: string): void
  setDisplay(fieldName: string, state: boolean): void
  setVisible(fieldName: string, state: boolean): void
  setReadOnly(fieldName: string, state: boolean): void
  setMandatory(fieldName: string, state: boolean): void

  addOption(fieldName: string, value: string, label: string, index?: number): void
  removeOption(fieldName: string, value: string): void
  clearOptions(fieldName: string): void

  addErrorMessage(message: string): void
  addInfoMessage(message: string): void
  showErrorBox(fieldName: string, message: string): void
  hideErrorBox(fieldName: string): void
  showFieldMsg(fieldName: string, message: string, type?: string): void
  hideFieldMsg(fieldName: string, clearAll?: boolean): void
  hideAllFieldMsgs(type?: string): void

  addDecoration(fieldName: string, icon: SnDecorationIcon, title?: string): void
  removeDecoration(fieldName: string, icon?: SnDecorationIcon, title?: string): void

  getReference(
    fieldName: string,
    callback: (record: SnGFormReference | null) => void
  ): Promise<void>

  getActionName(): string
  save(action?: string): void | Promise<void>
  submit(action?: string): void | Promise<void>
}

export type UiActionClientGForm = Omit<SnGForm, 'save' | 'submit'>

export type UiActionClientContext = {
  values: SnFormValues
  gForm: UiActionClientGForm
}

export type UiActionClientCallback = (
  action: SnUiAction,
  context: UiActionClientContext
) => boolean | Promise<boolean>

export type BeforeUiActionSubmitCallback = UiActionClientCallback
