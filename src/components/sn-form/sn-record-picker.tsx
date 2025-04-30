import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../components/ui/command'

import { useRef, useState, UIEvent, MouseEvent } from 'react'
import { useDebounce } from './hooks/useDebounce'
import { usePickerData } from './hooks/usePickerData'
import { SnRecordPickerItem as Record } from '@/types/form-schema'

interface RecordPickerProps {
  table: string
  fields: string[]
  query?: string
  value?: Record | null
  onChange: (record: Record | null) => void
  pageSize?: number
}

export function SnRecordPicker({ table, fields, query = '', value, onChange, pageSize = 20 }: RecordPickerProps) {
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
  })

  function handleScroll(e: UIEvent<HTMLDivElement>) {
    const target = e.currentTarget
    if (!loading && hasMore && target.scrollTop + target.clientHeight >= target.scrollHeight - 10) {
      fetchRecords(page + 1, debouncedSearchTerm)
    }
  }

  function handleClearSelection(e: MouseEvent<SVGElement>) {
    e.stopPropagation()
    onChange(null)
    setSearchTerm('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full">
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between pr-8">
            <div className="flex-1 truncate text-left">{value ? value.display_value : 'Select a record...'}</div>
            <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>

        {value && (
          <X
            className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
            onClick={handleClearSelection}
          />
        )}
      </div>

      <PopoverContent className="w-[300px] p-0">
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
                <CommandItem
                  key={record.value}
                  value={record.value}
                  onSelect={currentValue => {
                    const selectedRecord = records.find(r => r.value === currentValue) || null
                    onChange(selectedRecord)
                    setOpen(false)
                    setSearchTerm('')
                  }}
                >
                  {record.display_value}
                  <Check className={cn('ml-auto', value?.value === record.value ? 'opacity-100' : 'opacity-0')} />
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
