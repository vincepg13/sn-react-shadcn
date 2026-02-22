import { cn } from '@kit/lib/utils'
import { Button } from '@kit/components/ui/button'
import { getFieldList } from '@kit/utils/form-api'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useFieldUI } from '../contexts/FieldUIContext'
import { choicesToTableMap } from '@kit/utils/form-client'
import { SnConditionRow } from '@kit/types/condition-schema'
import { SnDotwalkChoice } from '@kit/components/sn-ui/sn-dotwalk-choice'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@kit/components/ui/command'

interface SnFieldfListProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  dependentValue: string
  multiple?: boolean
}

type ChildProps = {
  table: string
  readonly: boolean
  value: string
  initialLabel?: string
  multiple?: boolean
  fieldList: NonNullable<SnFieldSchema['choices']>
  onChange: (value: string, dv?: string) => void
}

export function SnFieldFieldList({ rhfField, field, dependentValue, onChange, multiple = false }: SnFieldfListProps) {
  const mounted = useRef(false)
  const { readonly } = useFieldUI()
  const [fieldList, setFieldList] = useState(Array.isArray(field.choices) ? field.choices || [] : [])

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }

    if (!dependentValue) {
      setFieldList([])
      return
    }

    const getNewFields = async () => {
      const controller = new AbortController()
      const fl = await getFieldList(dependentValue, controller)
      setFieldList(fl)
    }

    getNewFields()
  }, [dependentValue])

  const walkable = field.attributes?.allow_references === 'true'

  return !multiple && walkable ? (
    <DotWalkedChoiceSelect
      table={dependentValue}
      readonly={readonly}
      value={String(rhfField.value)}
      initialLabel={field.displayValue}
      fieldList={fieldList}
      onChange={onChange}
    />
  ) : (
    <LocalChoiceSelect
      readonly={readonly}
      value={String(rhfField.value)}
      multiple={multiple}
      fieldList={fieldList}
      onChange={onChange}
    />
  )
}

function DotWalkedChoiceSelect({ table, initialLabel, readonly, value, fieldList, onChange }: ChildProps) {
  const [fieldsByTable, setFieldsByTable] = useState(choicesToTableMap(table, fieldList))
  const [label, setLabel] = useState(value ? initialLabel?.replaceAll('.', '/') : 'Select field...')

  useEffect(() => {
    setFieldsByTable(choicesToTableMap(table, fieldList))
  }, [table, fieldList])

  const onChangeWalkedField = (updated: Partial<SnConditionRow>, _table: string) => {
    setLabel(updated.fieldLabel || '')
    onChange(updated.field || '', updated.fieldLabel || '')
  }

  return (
    <SnDotwalkChoice
      label={label}
      disabled={readonly}
      baseTable={table}
      fieldsByTable={fieldsByTable}
      setFieldsByTable={setFieldsByTable}
      onChange={onChangeWalkedField}
    />
  )
}

function LocalChoiceSelect({ readonly, value, multiple = false, fieldList, onChange }: Omit<ChildProps, 'table'>) {
  const [open, setOpen] = useState(false)
  const selectedValues = multiple
    ? value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
    : value
      ? [value]
      : []
  const selectedSet = new Set(selectedValues)

  const selectedLabel = multiple
    ? selectedValues
        .map(selected => fieldList.find(fName => fName.name === selected)?.label || selected)
        .join(', ')
    : fieldList.find(fName => fName.name === value)?.label

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={readonly}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full min-w-0 justify-between',
            multiple && 'h-auto min-h-9 whitespace-normal py-2 items-start'
          )}
        >
          <span
            className={cn(
              'min-w-0 flex-1 text-left',
              multiple ? 'whitespace-normal break-words' : 'truncate whitespace-nowrap'
            )}
          >
            {selectedLabel || 'Select field...'}
          </span>
          <span className="ml-2 inline-flex shrink-0 items-center gap-1">
            {multiple && selectedValues.length > 0 && !readonly && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selected fields"
                className="inline-flex cursor-pointer items-center text-muted-foreground hover:text-foreground"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  onChange('', '')
                }}
                onKeyDown={e => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  e.stopPropagation()
                  onChange('', '')
                }}
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search fields..." className="h-9" />
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup>
              {fieldList &&
                fieldList.map(fName => (
                  <CommandItem
                    key={fName.name}
                    value={fName.name}
                    onSelect={currentValue => {
                      if (!multiple) {
                        onChange(currentValue === value ? '' : currentValue)
                        setOpen(false)
                        return
                      }

                      const nextValues = selectedSet.has(currentValue)
                        ? selectedValues.filter(v => v !== currentValue)
                        : [...selectedValues, currentValue]
                      const nextDisplayValues = nextValues
                        .map(v => fieldList.find(fieldChoice => fieldChoice.name === v)?.label || v)
                        .join(', ')
                      onChange(nextValues.join(','), nextDisplayValues)
                    }}
                  >
                    {fName.label}
                    <Check className={cn('ml-auto', selectedSet.has(fName.name || '') ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
