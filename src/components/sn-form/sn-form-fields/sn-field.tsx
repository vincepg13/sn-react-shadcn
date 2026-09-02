import { CircleAlert, CircleHelp, Info, TriangleAlert } from 'lucide-react'
import { SnFieldUrl } from './sn-field-url'
import { SnFieldDate } from './sn-field-date'
import { SnFieldTime } from './sn-field-time'
import { SnFieldInput } from './sn-field-input'
import { SnFieldHtml } from './sn-field-html'
import { useFormContext } from 'react-hook-form'
import { SnFieldScript } from './sn-field-script'
import { SnFieldChoice } from './sn-field-choice'
import { SnFieldNumeric } from './sn-field-numeric'
import { SnFieldTableName } from './sn-field-table'
import { SnFieldTextarea } from './sn-field-textarea'
import { SnFieldCheckbox } from './sn-field-checkbox'
import { SnFieldCurrency } from './sn-field-currency'
import { SnFieldDuration } from './sn-field-duration'
import { SnSimpleTooltip } from '@kit/exports/ui.index'
import { Alert, AlertDescription } from '../../ui/alert'
import { SnFieldFieldList } from './sn-field-field-list'
import { SnFieldMedia } from './sn-media/sn-field-media'
import { SnFieldCondition } from './sn-field-condition'
import { SnFieldReference } from './sn-field-reference'
import { SnFieldUserRoles } from './sn-field-user-roles'
import { useDotSafeForm } from '../hooks/useDotSafeForm'
import { FieldUIContext } from '../contexts/FieldUIContext'
import { linkRefFieldDotWalks } from '@kit/utils/form-client'
import { useEffectiveFieldState } from '../hooks/useFieldUiState'
import { SN_DECORATION_ICON_MAP } from '@kit/utils/decoration-icons'
import { useClientScripts } from '../contexts/SnClientScriptContext'
import { useUiPoliciesContext } from '../contexts/SnUiPolicyContext'
import { ReactNode, useRef, useCallback, memo, RefObject, useEffect } from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../ui/hover-card'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '../../ui/form'
import {
  SnFieldSchema,
  RHFField,
  FieldUIState,
  SnFieldPrimitive,
  SnCurrencyField,
  FieldMessage,
  HintDisplayType,
  SnReferenceFieldCallbacks,
} from '../../../types/form-schema'

interface SnFieldProps {
  field: SnFieldSchema
  fieldList: string[]
  fieldUIState: Record<string, FieldUIState>
  displayValues: RefObject<Record<string, string>>
  table: string
  guid: string
  hintDisplay?: HintDisplayType
  textareaThreshold?: number
  referenceFieldCallbacks?: SnReferenceFieldCallbacks
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void
}

const getFieldMessageClassName = (msgType: FieldMessage['type']) => {
  const base = 'flex items-start gap-2 rounded-md border px-3 py-2 text-sm shadow-xs'

  switch (msgType) {
    case 'error':
      return `${base} border-red-200/70 bg-red-50/70 text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100 [&>svg]:text-red-600 dark:[&>svg]:text-red-400`
    case 'warning':
      return `${base} border-amber-200/70 bg-amber-50/70 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400`
    default:
      return `${base} border-blue-200/70 bg-blue-50/70 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400`
  }
}

const getFieldMessageIcon = (msgType: FieldMessage['type']) => {
  switch (msgType) {
    case 'error':
      return CircleAlert
    case 'warning':
      return TriangleAlert
    default:
      return Info
  }
}

function SnFieldComponent({
  field,
  fieldList,
  fieldUIState,
  guid,
  table,
  displayValues,
  hintDisplay = 'alert',
  textareaThreshold = 200,
  referenceFieldCallbacks,
}: SnFieldProps) {
  const form = useFormContext() as ReturnType<typeof useDotSafeForm>
  const { control, getValues, setValue, watch, trigger, toSafe } = form

  const { runClientScriptsForFieldChange, fieldChangeHandlers } = useClientScripts()
  const { runUiPoliciesForField } = useUiPoliciesContext()

  const controllerRef = useRef(new AbortController())
  useEffect(() => () => controllerRef.current.abort(), [])

  const oldValueRef = useRef<SnFieldPrimitive>(field.value)
  const formLabelRightRef = useRef<HTMLDivElement | null>(null)

  const fieldUI = useEffectiveFieldState({
    field,
    uiState: fieldUIState,
    fieldVal: String(getValues(field.name) ?? ''),
  })

  const handleChange = useCallback(
    async (newValue: SnFieldPrimitive, display?: string) => {
      // setValue(toRHF(field.name), newValue, { shouldDirty: true, shouldTouch: true })
      setValue(field.name, newValue, { shouldDirty: true, shouldTouch: true })
      runClientScriptsForFieldChange(field.name, oldValueRef.current, newValue, false)
      runUiPoliciesForField(field.name)

      oldValueRef.current = newValue
      displayValues.current[field.name] = display || newValue.toString() || ''

      await linkRefFieldDotWalks(
        field.type,
        field.name,
        field.ed!.reference,
        fieldList,
        String(newValue),
        setValue,
        displayValues,
        toSafe,
        controllerRef
      )
    },
    [
      field.ed,
      field.name,
      field.type,
      fieldList,
      displayValues,
      setValue,
      runClientScriptsForFieldChange,
      runUiPoliciesForField,
      toSafe,
    ]
  )

  fieldChangeHandlers[field.name] = handleChange

  if (!fieldUI.visible) return null

  return (
    <FieldUIContext.Provider value={fieldUI}>
      <FormField
        name={toSafe(field.name)}
        control={control}
        render={({ field: rhfField }) => {
          const DecorationIcon = fieldUI.decoration ? SN_DECORATION_ICON_MAP[fieldUI.decoration.icon] : null
          const hint = field.hint?.trim()
          const handleFocus = () => {}

          const handleSelect = (newValue: SnFieldPrimitive, displayValue?: string) => {
            handleChange(newValue, displayValue)
            trigger(field.name)
          }

          const input = renderFieldComponent(
            table,
            guid,
            field,
            rhfField,
            fieldUI.readonly,
            handleChange,
            handleSelect,
            handleFocus,
            getValues(),
            watch,
            formLabelRightRef,
            textareaThreshold,
            referenceFieldCallbacks
          )

          if (!input) return <></>

          return (
            <FormItem className="mb-4">
              {field.type !== 'boolean' && (
                <FormLabel className="flex items-center justify-between">
                  <span className="inline-flex items-center">
                    {DecorationIcon && (
                      <SnSimpleTooltip content={fieldUI.decoration?.title || ''}>
                        <span className="mr-1.5 inline-flex text-muted-foreground">
                          <DecorationIcon className="size-3.5" aria-hidden />
                        </span>
                      </SnSimpleTooltip>
                    )}
                    {fieldUI.mandatory && <span className={rhfField.value ? 'text-grey-500' : 'text-red-500'}>*</span>}

                    {fieldUI.label}
                    {hint && hintDisplay === 'hover' && (
                      <HoverCard openDelay={100}>
                        <HoverCardTrigger asChild>
                          <span
                            tabIndex={0}
                            aria-label={`Hint for ${fieldUI.label}`}
                            className="ml-1 inline-flex cursor-help text-muted-foreground"
                          >
                            <CircleHelp className="size-3.5" aria-hidden />
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="text-sm whitespace-pre-wrap">{hint}</HoverCardContent>
                      </HoverCard>
                    )}
                  </span>
                  <div ref={formLabelRightRef} />
                </FormLabel>
              )}
              {field.type !== 'boolean' && hint && hintDisplay === 'alert' && (
                <Alert className="flex items-start gap-2 border-muted-foreground/20 bg-muted/50 px-3 py-2 text-muted-foreground">
                  <span className="mt-0.5 inline-flex shrink-0">
                    <CircleHelp className="size-4" aria-hidden />
                  </span>
                  <AlertDescription className="leading-5 whitespace-pre-wrap text-muted-foreground">
                    {hint}
                  </AlertDescription>
                </Alert>
              )}
              <FormControl>{input}</FormControl>
              <FormMessage />
              {fieldUI.fieldMsgs?.map((message, index) => {
                const MessageIcon = getFieldMessageIcon(message.type)

                return (
                  <FormMessage
                    key={`${message.type}-${index}`}
                    useError={false}
                    className={getFieldMessageClassName(message.type)}
                  >
                    <MessageIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{message.text}</span>
                  </FormMessage>
                )
              })}
            </FormItem>
          )
        }}
      />
    </FieldUIContext.Provider>
  )
}

function renderFieldComponent(
  table: string,
  guid: string,
  field: SnFieldSchema,
  rhfField: RHFField,
  readonly: boolean,
  handleChange: (value: SnFieldPrimitive, display?: string) => void,
  handleSelect: (value: SnFieldPrimitive, display?: string) => void,
  handleFocus: () => void,
  formValues: Record<string, string>,
  watch: ReturnType<typeof useFormContext>['watch'],
  adornmentRef: RefObject<HTMLDivElement | null>,
  textareaThreshold: number,
  referenceFieldCallbacks?: SnReferenceFieldCallbacks
): ReactNode {
  const depField = field.dependentField || ''
  const depValue = depField ? watch(depField) : undefined

  // TODO:
  // - Field List

  switch (field.type) {
    case 'email':
    case 'string':
    case 'string_full_utf8':
    case 'translated_field':
    case 'translated_text':
    case 'sysevent_name':
    case 'condition_string':
    case 'compressed':
    case 'password':
    case 'password2':
    case 'journal_input':
      if (field.type.startsWith('password'))
        return <SnFieldInput rhfField={rhfField} onChange={handleChange} onFocus={handleFocus} type="password" />
      if (field.type == 'journal_input' || (field.max_length && field.max_length > textareaThreshold)) {
        return <SnFieldTextarea field={field} rhfField={rhfField} onChange={handleChange} onFocus={handleFocus} />
      }
      return (
        <SnFieldInput rhfField={rhfField} maxLength={field.max_length} onChange={handleChange} onFocus={handleFocus} />
      )
    case 'choice':
      return <SnFieldChoice field={field} rhfField={rhfField} onChange={handleSelect} />
    case 'boolean':
      return <SnFieldCheckbox field={field} rhfField={rhfField} onChange={handleChange} />
    case 'table_name':
      return <SnFieldTableName field={field} rhfField={rhfField} onChange={handleChange} />
    case 'user_roles':
      return (
        <SnFieldUserRoles
          field={field}
          table={table}
          rhfField={rhfField}
          recordSysId={guid}
          formValues={formValues}
          onChange={handleSelect}
          dependentValue={depValue}
        />
      )
    case 'reference':
    case 'document_id':
    case 'glide_list': {
      return (
        <SnFieldReference
          field={field}
          table={table}
          recordSysId={guid}
          formValues={formValues}
          onChange={handleSelect}
          dependentValue={depValue}
          onViewReference={guid !== '' && guid !== '-1' ? referenceFieldCallbacks?.[field.name] : undefined}
        />
      )
    }
    case 'glide_date':
    case 'glide_date_time':
      return <SnFieldDate field={field} rhfField={rhfField} onChange={handleSelect} />
    case 'glide_time':
      return <SnFieldTime rhfField={rhfField} onChange={handleSelect} />
    case 'glide_duration':
      return <SnFieldDuration field={field} rhfField={rhfField} onChange={handleSelect} />
    case 'url':
      return <SnFieldUrl rhfField={rhfField} onChange={handleChange} />
    case 'price':
    case 'currency':
      return (
        <SnFieldCurrency
          field={field as SnCurrencyField}
          readonly={readonly}
          rhfField={rhfField}
          onChange={handleChange}
        />
      )
    case 'integer':
    case 'float':
    case 'decimal':
      return (
        <SnFieldNumeric
          readonly={readonly}
          value={rhfField.value as number}
          onValueChange={value => handleChange(value ?? '')}
          onFocus={handleFocus}
          thousandSeparator=","
          decimalSeparator="."
          decimalScale={field.type === 'float' || field.type === 'decimal' ? 2 : 0}
          fixedDecimalScale={field.type === 'decimal'}
        />
      )
    case 'html':
    case 'translated_html':
      return <SnFieldHtml rhfField={rhfField} onChange={handleChange} />
    case 'field_list':
    case 'field_name': {
      return (
        <SnFieldFieldList
          field={field}
          rhfField={rhfField}
          onChange={handleChange}
          dependentValue={depValue}
          multiple={field.type === 'field_list'}
        />
      )
    }
    case 'conditions':
      return (
        <SnFieldCondition
          field={field}
          rhfField={rhfField}
          onFocus={handleFocus}
          onChange={handleChange}
          dependentValue={depValue}
          adornmentRef={adornmentRef}
        />
      )
    case 'css':
    case 'xml':
    case 'json':
    case 'script':
    case 'properties':
    case 'script_plain':
    case 'html_template':
      return (
        <SnFieldScript
          table={table}
          field={field}
          rhfField={rhfField}
          adornmentRef={adornmentRef}
          onChange={handleChange}
        />
      )
    case 'video':
    case 'user_image':
    case 'file_attachment': {
      const extension = field.type === 'user_image' ? '.iix' : field.type === 'video' ? '.vvx' : ''
      return (
        <SnFieldMedia
          table={table}
          attachmentGuid={guid}
          field={field}
          rhfField={rhfField}
          onChange={handleChange}
          extension={extension}
        />
      )
    }
    default:
      return null
  }
}

export const SnField = memo(SnFieldComponent)
