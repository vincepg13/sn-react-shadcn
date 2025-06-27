import { useEffect, useRef, useState, UIEvent, MouseEvent, useMemo, useCallback } from 'react'
import { cn } from '@kit/lib/utils'
import { Button } from '@kit/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@kit/components/ui/command'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { useClientScripts } from '../contexts/SnClientScriptContext'
import { SnFieldSchema } from '@kit/types/form-schema'
import { useDebounce } from '../hooks/useDebounce'
import { useFieldUI } from '../contexts/FieldUIContext'
import { useReferenceSelected } from '../hooks/references/useReferenceSelected'
import { useReferenceRecords, RefRecord } from '../hooks/references/useReferenceRecords'
import { buildReferenceQuery, getTableDisplayFields } from '../../../utils/form-api'

interface SnReferenceProps {
  field: SnFieldSchema
  onChange: (val: string | string[]) => void
  formValues: Record<string, string>
  table: string
  recordSysId: string
  dependentValue?: string
}

export function SnFieldReference({
  field,
  onChange,
  formValues,
  table,
  recordSysId,
  dependentValue,
}: SnReferenceProps) {
  const { readonly } = useFieldUI()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const listRef = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)

  const { apis } = useClientScripts()
  const type = field.type
  const isMultiple = type === 'glide_list'

  //Clone the ed object to add reference values for doc IDs
  const ed = useMemo(() => {
    const clonedEd = { ...field.ed! }

    if (type === 'document_id') clonedEd.reference = dependentValue ?? field.ed!.dependent_value!

    return clonedEd
  }, [type, dependentValue, field.ed])

  //Clone the attributes and fetch display fields if needed
  const attributes = useMemo(() => {
    const clonedAttrs = { ...field.attributes }
    if (type === 'document_id' && ed.reference) {
      const fetchDisplays = async () => {
        try {
          const displayFields = await getTableDisplayFields(ed.reference, apis?.refDisplay)
          let fields = displayFields
          if (!fields || !fields.length) fields = ['number']
          clonedAttrs.ref_ac_columns = fields.join(';')
        } catch (error) {
          console.error('Error fetching table display fields:', error)
        }
      }

      fetchDisplays()
    }

    return clonedAttrs
  }, [apis?.refDisplay, ed.reference, field.attributes, type])

  const orderBy = useMemo(() => attributes?.ref_ac_order_by?.split(';') || [], [attributes?.ref_ac_order_by])

  const displayCols = useMemo(() => {
    const coreDisplay = ed.searchField ? [ed.searchField] : []
    const refFields = attributes?.ref_ac_columns?.split(';') || []
    return [...new Set([...coreDisplay, ...refFields])]
  }, [attributes?.ref_ac_columns, ed.searchField])

  const { value: rawValue, display: rawDisplay } = useReferenceSelected({
    value: formValues[field.name],
    displayValue: field.displayValue,
  })

  const selected = useMemo(() => {
    return rawValue.map(
      (v, i): RefRecord => ({
        value: v,
        display_value: rawDisplay[i] || v,
        raw: {},
      })
    )
  }, [rawValue, rawDisplay])

  const [selectedRecords, setSelectedRecords] = useState<RefRecord[]>(selected)

  const excludeValues = useMemo(() => (isMultiple ? selected.map(r => r.value) : []), [isMultiple, selected])

  const query = useMemo(() => {
    return buildReferenceQuery({
      columns: displayCols,
      term: debounced,
      operator: ed.defaultOperator || 'LIKE',
      orderBy,
      excludeValues,
    })
  }, [displayCols, debounced, ed.defaultOperator, orderBy, excludeValues])

  const { records, page, loading, fetchPage } = useReferenceRecords({
    ed,
    table,
    fieldName: field.name,
    recordSysId,
    displayCols,
    formValues,
    fetchable: open,
  })

  const fetchPageRef = useRef(fetchPage)
  useEffect(() => {
    fetchPageRef.current = fetchPage
  }, [fetchPage])

  useEffect(() => {
    if (query || (open && !wasOpen.current)) {
      fetchPageRef.current(query, 0, true)
    }
    wasOpen.current = open
  }, [open, query])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      fetchPage(query, page + 1)
    }
  }

  const isSelected = (val: string) => selectedRecords.some(r => r.value === val)

  const handleSelect = (val: string) => {
    const record = records.find(r => r.value === val)
    if (!record) return

    //field.displayValue mutated below only for display purposes
    if (isMultiple) {
      const updated = isSelected(val) ? selectedRecords.filter(r => r.value !== val) : [...selectedRecords, record]
      setSelectedRecords(updated)
      onChange(updated.map(r => r.value).toString())
      field.displayValue = updated.map(r => r.display_value).join(',')
    } else {
      setSelectedRecords([record])
      onChange(record.value)
      setOpen(false)
      setSearch('')
      field.displayValue = record.display_value
    }
  }

  const handleClear = useCallback(
    (e?: MouseEvent) => {
      if (e) e.stopPropagation()
      setSelectedRecords([])
      onChange(isMultiple ? [] : '')
    },
    [onChange, isMultiple]
  )

  const previousDependentValue = useRef<string | undefined>(dependentValue)
  useEffect(() => {
    if (previousDependentValue.current !== undefined && previousDependentValue.current !== dependentValue) {
      handleClear()
    }
    previousDependentValue.current = dependentValue
  }, [dependentValue, handleClear])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative w-full overflow-hidden">
        <PopoverTrigger asChild className="overflow-hidden">
          {isMultiple ? (
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
              {selectedRecords.length === 0 && <span className="text-muted-foreground">{field.label}</span>}
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
                      onChange(updated.map(r => r.value))
                      field.displayValue = updated.map(r => r.display_value).join(',')
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Button
              disabled={readonly}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between pr-8 min-h-[40px] overflow-hidden"
            >
              <span className="truncate text-left">
                {selectedRecords[0]?.display_value || <span className="text-muted-foreground">{field.label}</span>}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
            </Button>
          )}
        </PopoverTrigger>

        {selectedRecords.length > 0 && !readonly && (
          <X
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer',
              isMultiple ? 'right-4' : 'right-8'
            )}
            onClick={handleClear}
          />
        )}
      </div>

      <PopoverContent className="w-full max-w-[500px] p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} className="pr-10" />
            {loading && (
              <Loader2 className="absolute right-2 top-1/2 h-4 w-4 animate-spin text-muted-foreground transform -translate-y-1/2" />
            )}
          </div>
          <CommandList ref={listRef} onScroll={handleScroll}>
            {!loading && records.length === 0 && <CommandEmpty>No results.</CommandEmpty>}
            <CommandGroup>
              {records.map(r => (
                <CommandItem key={r.value} value={r.value} onSelect={() => handleSelect(r.value)}>
                  <div className="flex flex-col gap-1">
                    {r.display_value}
                    {r.primary && <span className="text-muted-foreground text-sm">{r.primary}</span>}
                    {r.secondary && <span className="text-muted-foreground text-sm">{r.secondary}</span>}
                  </div>
                  <Check
                    className={cn('ml-auto', {
                      'opacity-100': isSelected(r.value),
                      'opacity-0': !isSelected(r.value),
                    })}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
