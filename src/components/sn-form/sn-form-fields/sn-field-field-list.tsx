import { cn } from '@kit/lib/utils'
import { Button } from '@kit/components/ui/button'
import { getFieldList } from '@kit/utils/form-api'
import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
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
}

type ChildProps = {
  table: string
  readonly: boolean
  value: string
  initialLabel?: string
  fieldList: NonNullable<SnFieldSchema['choices']>
  onChange: (value: string, dv?: string) => void
}

export function SnFieldFieldList({ rhfField, field, dependentValue, onChange }: SnFieldfListProps) {
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

  return walkable ? (
    <DotWalkedChoiceSelect
      table={dependentValue}
      readonly={readonly}
      value={String(rhfField.value)}
      initialLabel={field.displayValue}
      fieldList={fieldList}
      onChange={onChange}
    />
  ) : (
    <LocalChoiceSelect readonly={readonly} value={String(rhfField.value)} fieldList={fieldList} onChange={onChange} />
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

function LocalChoiceSelect({ readonly, value, fieldList, onChange }: Omit<ChildProps, 'table'>) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={readonly}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? fieldList.find(fName => fName.name === value)?.label : 'Select field...'}
          <ChevronsUpDown className="opacity-50" />
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
                      onChange(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    {fName.label}
                    <Check className={cn('ml-auto', value === fName.name ? 'opacity-100' : 'opacity-0')} />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
