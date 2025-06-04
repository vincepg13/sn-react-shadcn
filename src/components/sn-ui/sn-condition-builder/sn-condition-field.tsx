import { Button } from '@kit/components/ui/button'
import { useCondMeta } from './contexts/SnConditionsContext'
import { getTableMetadata } from '@kit/utils/conditions-api'
import { ChevronRight, ChevronLeft, RotateCcw } from 'lucide-react'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { SnConditionMap, SnConditionRow } from '@kit/types/condition-schema'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Command, CommandInput, CommandItem, CommandList } from '@kit/components/ui/command'

interface SnConditionFieldProps {
  condition: SnConditionRow
  fieldsByTable: Record<string, SnConditionMap>
  setFieldsByTable: Dispatch<SetStateAction<Record<string, SnConditionMap>>>
  onChange: (updated: Partial<SnConditionRow>, table: string) => void
}

export function SnConditionField({ condition, fieldsByTable, setFieldsByTable, onChange }: SnConditionFieldProps) {
  const baseTable = useCondMeta().table
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<{name: string, label: string}[]>([])

  const currentTable = path.reduce((table, field) => {
    const ref = fieldsByTable[table]?.[field.name]?.reference
    return ref || table
  }, baseTable)

  const currentFields = fieldsByTable[currentTable] || {}

  useEffect(() => {
    if (!fieldsByTable[currentTable]) {
      getTableMetadata(currentTable, new AbortController()).then(meta => {
        if (meta) {
          setFieldsByTable(prev => ({ ...prev, [currentTable]: meta }))
        }
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
    setOpen(false)
  }

  const handleDrillIn = (name: string, label: string) => {
    setPath(prev => [...prev, {name, label}])
  }

  const handleBack = () => setPath(prev => prev.slice(0, -1))
  const handleReset = () => setPath([])

  const trailLabels = path.map(
    (key, i) =>
      fieldsByTable[path.slice(0, i).reduce((t, f) => fieldsByTable[t]?.[f.name]?.reference || t, baseTable)]?.[key.name]
        ?.label || key
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start truncate">
          {condition.fieldLabel || 'Select field'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[320px]">
        <Command>
          {path.length > 0 && (
            <div className="flex items-center justify-between px-2 py-1 border-b">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {path.length > 0 && (
                  <Button onClick={handleBack} size="sm" variant="ghost" className="px-1 h-6">
                    <ChevronLeft className="h-3 w-3" /> Back
                  </Button>
                )}
                <span className="truncate">/ {trailLabels.join(' / ')}</span>
              </div>
              <Button onClick={handleReset} size="sm" variant="ghost" className="px-1 h-6">
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}

          <CommandInput placeholder="Search fields..." />
          <CommandList>
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
                        handleDrillIn(field.name, field.label)
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
