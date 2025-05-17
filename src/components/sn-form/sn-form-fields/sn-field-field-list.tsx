import { cn } from '@kit/lib/utils'
import { Button } from '@kit/components/ui/button'
import { Check, ChevronsUpDown } from 'lucide-react'
import { getFieldList } from '@kit/utils/form-api'
import { useEffect, useRef, useState } from 'react'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@kit/components/ui/command'

interface SnFieldfListProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  dependentValue: string
}

export function SnFieldFieldList({ rhfField, field, dependentValue, onChange }: SnFieldfListProps) {
  const mounted = useRef(false)
  const [open, setOpen] = useState(false)
  const [fieldList, setFieldList] = useState(field.choices || [])

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {rhfField.value ? fieldList.find(fName => fName.name === rhfField.value)?.label : 'Select field...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search fields..." className="h-9" />
          <CommandList>
            <CommandEmpty>No field found.</CommandEmpty>
            <CommandGroup>
              {fieldList.map(fName => (
                <CommandItem
                  key={fName.name}
                  value={fName.name}
                  onSelect={currentValue => {
                    onChange(currentValue === rhfField.value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  {fName.label}
                  <Check className={cn('ml-auto', rhfField.value === fName.name ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
