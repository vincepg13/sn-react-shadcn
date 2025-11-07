import { cn } from '@kit/lib/utils'
import { Button } from '@kit/components/ui/button'
import { useDebounce } from '../hooks/useDebounce'
import { SnFieldSchema } from '@kit/types/form-schema'
import { useFieldUI } from '../contexts/FieldUIContext'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { useClientScripts } from '../contexts/SnClientScriptContext'
import { useReferenceSelected } from '../hooks/references/useReferenceSelected'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { buildReferenceQuery, getTableDisplayFields } from '../../../utils/form-api'
import { useReferenceRecords, RefRecord } from '../hooks/references/useReferenceRecords'
import { useEffect, useRef, useState, UIEvent, MouseEvent, useMemo, useCallback } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@kit/components/ui/command'

export interface SnReferenceProps {
  field: SnFieldSchema
  onChange: (val: string | string[], displayValue?: string) => void
  formValues: Record<string, string>
  table: string
  recordSysId: string
  dependentValue?: string
  forceRefQuery?: boolean
}

export function SnFieldReference({
  field,
  table,
  formValues,
  recordSysId,
  dependentValue,
  forceRefQuery = false,
  onChange,
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

  const disabled = readonly

  // Clone ED; inject reference for document_id
  const ed = useMemo(() => {
    const cloned = { ...field.ed! }
    if (type === 'document_id') {
      cloned.reference = dependentValue ?? field.ed!.dependent_value!
    }
    return cloned
  }, [type, dependentValue, field.ed])

  // Clone attributes & fetch display columns when needed
  const attributes = useMemo(() => {
    const cloned = { ...field.attributes }
    if (type === 'document_id' && ed.reference) {
      ;(async () => {
        try {
          const displayFields = await getTableDisplayFields(ed.reference, apis?.refDisplay)
          let fields = displayFields
          if (!fields || !fields.length) fields = ['number']
          cloned.ref_ac_columns = fields.join(';')
        } catch (e) {
          console.error('Error fetching table display fields:', e)
        }
      })()
    }
    return cloned
  }, [apis?.refDisplay, ed.reference, field.attributes, type])

  const orderBy = useMemo(() => attributes?.ref_ac_order_by?.split(';') || [], [attributes?.ref_ac_order_by])

  const displayCols = useMemo(() => {
    const core = ed.searchField ? [ed.searchField] : []
    const ref = attributes?.ref_ac_columns?.split(';') || []
    return [...new Set([...core, ...ref])]
  }, [attributes?.ref_ac_columns, ed.searchField])

  const { value: rawValue, display: rawDisplay } = useReferenceSelected({
    value: formValues[field.name],
    displayValue: field.displayValue,
  })

  const selected = useMemo<RefRecord[]>(
    () =>
      rawValue.map((v, i) => ({
        value: v,
        display_value: rawDisplay[i] || v,
        raw: {},
      })),
    [rawValue, rawDisplay]
  )

  const [selectedRecords, setSelectedRecords] = useState<RefRecord[]>(selected)

  const excludeValues = useMemo(() => (isMultiple ? selected.map(r => r.value) : []), [isMultiple, selected])

  const query = useMemo(
    () =>
      forceRefQuery && ed.qualifier
        ? ed.qualifier
        : buildReferenceQuery({
            columns: displayCols,
            term: debounced,
            operator: ed.defaultOperator || 'LIKE',
            orderBy,
            excludeValues,
          }),
    [forceRefQuery, ed.qualifier, ed.defaultOperator, displayCols, debounced, orderBy, excludeValues]
  )

  const { records, page, loading, fetchPage } = useReferenceRecords({
    ed,
    table,
    fieldName: field.name,
    recordSysId,
    displayCols,
    formValues,
    fetchable: open && !disabled,
  })

  const fetchPageRef = useRef(fetchPage)
  useEffect(() => {
    fetchPageRef.current = fetchPage
  }, [fetchPage])

  useEffect(() => {
    if (disabled) return
    if (query || (open && !wasOpen.current)) {
      fetchPageRef.current(query, 0, true)
    }
    wasOpen.current = open
  }, [open, query, disabled])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (disabled) return
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      fetchPage(query, page + 1)
    }
  }

  const isSelected = (val: string) => selectedRecords.some(r => r.value === val)

  const handleSelect = (val: string) => {
    if (disabled) return

    const record = records.find(r => r.value === val)
    if (!record) return

    if (isMultiple) {
      const updated = isSelected(val) ? selectedRecords.filter(r => r.value !== val) : [...selectedRecords, record]
      setSelectedRecords(updated)

      const dv = updated.map(r => r.display_value).join(',')
      onChange(updated.map(r => r.value).toString(), dv)
      field.displayValue = dv
    } else {
      setSelectedRecords([record])
      onChange(record.value, record.display_value)
      setOpen(false)
      setSearch('')
      field.displayValue = record.display_value
    }
  }

  const handleClear = useCallback(
    (e?: MouseEvent) => {
      if (disabled) return
      if (e) e.stopPropagation()
      setSelectedRecords([])
      onChange(isMultiple ? [] : '', '')
    },
    [onChange, isMultiple, disabled]
  )

  // Clear when dependent value changes
  const previousDependentValue = useRef<string | undefined>(dependentValue)
  useEffect(() => {
    if (previousDependentValue.current !== undefined && previousDependentValue.current !== dependentValue) {
      handleClear()
    }
    previousDependentValue.current = dependentValue
  }, [dependentValue, handleClear])

  return (
    <Popover open={disabled ? false : open} onOpenChange={next => !disabled && setOpen(next)}>
      <div className={cn('relative w-full overflow-hidden', disabled && 'cursor-not-allowed')} aria-disabled={disabled}>
        <PopoverTrigger asChild className="overflow-hidden">
          {isMultiple ? (
            <button
              type="button"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              onClick={() => setOpen(v => !v)}
              className={cn(
                'w-full min-w-[200px] flex items-center flex-wrap gap-1 border rounded-md px-3 py-2 text-sm shadow-sm text-left',
                'bg-background text-foreground',
                !disabled &&
                  'cursor-pointer hover:bg-accent hover:text-accent-foreground pr-4',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {selectedRecords.length === 0 && <span className="text-muted-foreground">{field.label}</span>}
              {selectedRecords.map(record => (
                <div
                  key={record.value}
                  className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm text-muted-foreground max-w-full"
                >
                  <span className="truncate max-w-[150px]">{record.display_value}</span>
                  {!disabled && (
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={e => {
                        e.stopPropagation()
                        const updated = selectedRecords.filter(r => r.value !== record.value)
                        const newDisplay = updated.map(r => r.display_value).join(',')

                        setSelectedRecords(updated)
                        onChange(
                          updated.map(r => r.value),
                          newDisplay
                        )
                        field.displayValue = newDisplay
                      }}
                    />
                  )}
                </div>
              ))}
            </button>
          ) : (
            <Button
              disabled={disabled}
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

        {selectedRecords.length > 0 && !disabled && (
          <X
            className={cn(
              'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer',
              isMultiple ? 'right-4' : 'right-8'
            )}
            onClick={handleClear}
          />
        )}
      </div>

      {!disabled && (
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
      )}
    </Popover>
  )
}
