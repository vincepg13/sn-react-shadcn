import { cn } from '@kit/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Command, CommandEmpty, CommandInput, CommandItem } from '@kit/components/ui/command'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface SnFieldTableProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
}

export function SnFieldTableName({ field, rhfField, onChange }: SnFieldTableProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const selected = field.choices!.find(c => c.value === rhfField.value)

  const filteredChoices = useMemo(() => {
    if (!search) return field.choices || []
    return field.choices!.filter(
      choice =>
        choice.label.toLowerCase().includes(search.toLowerCase()) ||
        choice.value.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, field.choices])

  const parentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: filteredChoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  }) 

  return (
    <Popover
      open={open}
      onOpenChange={nextOpen => {
        setOpen(nextOpen)
        if (nextOpen) {
          // Give it a tick for layout, then force measurement
          setTimeout(() => {
            rowVirtualizer.measure()
          }, 0)
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full overflow-hidden justify-between" ref={triggerRef}>
          <span className="overflow-hidden">{selected ? selected.label : 'Select table...'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0"  style={{ width: triggerRef.current?.offsetWidth }}>
        <Command shouldFilter={false} className="w-full">
          <CommandInput placeholder="Search table..." className="h-9" value={search} onValueChange={setSearch} />
          <CommandEmpty>No table found.</CommandEmpty>

          <div ref={parentRef} style={{ height: '300px', overflow: 'auto', position: 'relative' }} className="border-t">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const choice = filteredChoices[virtualRow.index]
                return (
                  <div
                    key={choice.value}
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <CommandItem
                      value={choice.value}
                      className="my-0"
                      onSelect={currentValue => {
                        onChange(currentValue === rhfField.value ? '' : currentValue)
                        setOpen(false)
                      }}
                    >
                      <div className="px-3 text-sm flex flex-col items-start whitespace-normal">
                        <span className="font-medium truncate">{choice.label.split('[')[0]}</span>
                        <span className="text-xs text-muted-foreground truncate">[{choice.value}]</span>
                        </div>
                      <Check
                        className={cn('ml-auto h-4 w-4', rhfField.value === choice.value ? 'opacity-100' : 'opacity-0')}
                      />
                    </CommandItem>
                  </div>
                )
              })}
            </div>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
