import { CommandGroup } from 'cmdk'
import { Button } from '@kit/components/ui/button'
import { getTableMetadata } from '@kit/utils/conditions-api'
import { ChevronRight, ChevronLeft, RotateCcw, LoaderCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { SnConditionMap, SnConditionRow } from '@kit/types/condition-schema'
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Command, CommandInput, CommandItem, CommandList } from '@kit/components/ui/command'

interface SnDotwalkChoiceProps {
  label?: string
  baseTable: string
  disabled?: boolean
  fieldsByTable: Record<string, SnConditionMap>
  setFieldsByTable: Dispatch<SetStateAction<Record<string, SnConditionMap>>>
  onChange: (updated: Partial<SnConditionRow>, table: string) => void
}

export function SnDotwalkChoice({ label, baseTable, fieldsByTable, disabled, setFieldsByTable, onChange }: SnDotwalkChoiceProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [path, setPath] = useState<{ name: string; label: string }[]>([])


  const currentTable = path.reduce((table, field) => {
    return fieldsByTable[table]?.[field.name]?.reference || table
  }, baseTable)

  const currentFields = fieldsByTable[currentTable] || {}

  useEffect(() => {
    if (!fieldsByTable[currentTable]) {
      setFetchingMeta(true)
      getTableMetadata(currentTable, new AbortController()).then(meta => {
        if (meta) {
          setFieldsByTable(prev => ({ ...prev, [currentTable]: meta }))
        }
        setFetchingMeta(false)
      })
    }
  }, [currentTable, fieldsByTable, setFieldsByTable])

  const handleSelectField = (fieldName: string, fieldLabel: string) => {
    const fullFieldName = [...path.map(p => p.name), fieldName].join('.')
    const fullFieldLabel = [...path.map(p => p.label), fieldLabel].join('/')
    const selected = currentFields[fieldName]
    const defaultOperator = selected?.operators?.[0]?.operator ?? ''

    const fVal = {
      field: fullFieldName,
      operator: defaultOperator,
      value: '',
      fieldLabel: fullFieldLabel,
      operatorLabel: '',
      fieldType: selected?.type,
      table: currentTable,
    }
    onChange(fVal, currentTable)
    setSearch('')
    setOpen(false)
  }

  const dotWalk = (name: string, label: string) => {
    setSearch('')
    setPath(prev => [...prev, { name, label }])
  }

  const handleBack = () => {
    setSearch('')
    setPath(prev => prev.slice(0, -1))
  }

  const handleReset = () => {
    setSearch('')
    setPath([])
  }

  const trailLabels = path.map(
    (key, i) =>
      fieldsByTable[path.slice(0, i).reduce((t, f) => fieldsByTable[t]?.[f.name]?.reference || t, baseTable)]?.[
        key.name
      ]?.label || key
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start truncate" disabled={disabled}>
          {label || 'Select field'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]">
        <Command>
          {path.length > 0 && (
            <div className="flex items-center px-2 py-1 border-b gap-1 text-muted-foreground text-xs">
              <Button onClick={handleBack} size="sm" variant="ghost" className="px-1 h-6">
                <ChevronLeft className="h-3 w-3" /> Back
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate">/ {trailLabels.join(' / ')}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{trailLabels.join(' / ')}</p>
                </TooltipContent>
              </Tooltip>
              <Button onClick={handleReset} size="sm" variant="ghost" className="px-1 h-6 ml-auto">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}

          <CommandInput placeholder="Search fields..." value={search} onValueChange={setSearch} />
          <CommandList>
            {fetchingMeta && (
              <CommandGroup className="flex justify-center p-2 text-sm text-muted-foreground">
                <div className="flex justify-center items-center gap-2">
                  <LoaderCircle className="animate-spin" />
                  <span>Fetching Columns...</span>
                </div>
              </CommandGroup>
            )}
            {Object.values(currentFields)
              .sort((a, b) => a.label.localeCompare(b.label))
              .map(field => (
                <CommandItem
                  key={field.name}
                  onSelect={() => handleSelectField(field.name, field.label)}
                  className="flex items-center justify-between"
                >
                  <span>{field.label}</span>
                  {field.type === 'reference' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1"
                      onClick={e => {
                        e.stopPropagation()
                        dotWalk(field.name, field.label)
                      }}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  )}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
