import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { useDebounce } from './hooks/useDebounce'
import { usePickerData } from './hooks/usePickerData'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { useRef, useState, UIEvent, MouseEvent, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { SnRecordPickerItem as Record } from '../../types/form-schema'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command'

interface RecordPickerProps {
  table: string
  fields: string[]
  onChange: (record: Record | Record[] | null) => void
  value?: Record | Record[] | null
  multiple?: boolean
  metaFields?: string[]
  query?: string
  pageSize?: number
  placeholder?: string
}

export function SnRecordPicker({
  table,
  fields,
  query = '',
  value,
  onChange,
  metaFields = [],
  pageSize = 20,
  placeholder = '-- Select a Record --',
  multiple = false,
}: RecordPickerProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const listRef = useRef<HTMLDivElement>(null)

  const { records, loading, hasMore, page, fetchRecords } = usePickerData({
    table,
    fields,
    query,
    searchTerm: debouncedSearchTerm,
    pageSize,
    open,
    metaFields,
  })

  const [selectedRecords, setSelectedRecords] = useState<Record[]>([])

  useEffect(() => {
    if (!multiple && value && !Array.isArray(value)) {
      setSelectedRecords([value])
    } else if (multiple && Array.isArray(value)) {
      setSelectedRecords(value)
    } else {
      setSelectedRecords([])
    }
  }, [value, multiple])

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    const target = e.currentTarget
    if (!loading && hasMore && target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      fetchRecords(page + 1, debouncedSearchTerm)
    }
  }

  function handleClearSelection(e: MouseEvent<SVGElement>) {
    e.stopPropagation()
    setSelectedRecords([])
    onChange(multiple ? [] : null)
    setSearchTerm('')
  }

  function handleSelect(currentValue: string) {
    const selected = records.find(r => r.value === currentValue)
    if (!selected) return

    if (multiple) {
      const exists = selectedRecords.some(r => r.value === selected.value)
      const updated = exists ? selectedRecords.filter(r => r.value !== selected.value) : [...selectedRecords, selected]
      setSelectedRecords(updated)
      onChange(updated)
    } else {
      setSelectedRecords([selected])
      onChange(selected)
      setOpen(false)
      setSearchTerm('')
    }
  }

  function isSelected(record: Record) {
    return multiple ? selectedRecords.some(r => r.value === record.value) : selectedRecords[0]?.value === record.value
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        {!multiple && (
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full min-w-[200px] min-h-[40.25px] justify-between pr-8"
            >
              <div className="flex-1 truncate text-left">
                {selectedRecords[0]?.display_value || <span className="text-muted-foreground">{placeholder}</span>}
              </div>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
            </Button>
          </PopoverTrigger>
        )}
        {multiple && (
          <PopoverTrigger asChild>
            <div
              role="combobox"
              aria-expanded={open}
              tabIndex={0}
              onClick={() => setOpen(!open)}
              className={cn(
                'w-full min-w-[200px] flex items-center flex-wrap gap-1 border rounded-md px-3 py-2 text-sm shadow-sm',
                'bg-background text-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring'
              )}
            >
              {selectedRecords.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
              {selectedRecords.map(record => (
                <div
                  key={record.value}
                  className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm text-muted-foreground max-w-full"
                >
                  <span className="truncate max-w-[150px]">{record.display_value}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={e => {
                      e.stopPropagation()
                      const updated = selectedRecords.filter(r => r.value !== record.value)
                      setSelectedRecords(updated)
                      onChange(updated)
                    }}
                  />
                </div>
              ))}
            </div>
          </PopoverTrigger>
        )}

        {selectedRecords.length > 0 && (
          <X
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer',
              multiple ? 'right-4' : 'right-8'
            )}
            onClick={handleClearSelection}
          />
        )}
      </div>

      <PopoverContent className="w-full max-w-[500px] p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder="Search records..."
              value={searchTerm}
              onValueChange={val => setSearchTerm(val)}
              className="pr-10"
            />
            {loading && (
              <Loader2 className="absolute right-2 top-1/2 h-4 w-4 animate-spin text-muted-foreground transform -translate-y-1/2" />
            )}
          </div>
          <CommandList ref={listRef} onScroll={handleScroll}>
            {!loading && records.length === 0 && <CommandEmpty>No records found.</CommandEmpty>}
            <CommandGroup>
              {records.map(record => (
                <CommandItem key={record.value} value={record.value} onSelect={() => handleSelect(record.value)}>
                  <div className="flex flex-col gap-1">
                    {record.display_value}
                    {record.primary && <span className="text-muted-foreground text-sm">{record.primary}</span>}
                    {record.secondary && <span className="text-muted-foreground text-sm">{record.secondary}</span>}
                  </div>
                  <Check className={cn('ml-auto', isSelected(record) ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
              {loading && <div className="text-center text-muted-foreground text-sm p-2">Loading...</div>}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
