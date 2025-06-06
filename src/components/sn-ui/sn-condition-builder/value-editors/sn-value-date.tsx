import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/components/ui/select'
import { Popover, PopoverTrigger, PopoverContent } from '@kit/components/ui/popover'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@kit/components/ui/calendar'
import { Button } from '@kit/components/ui/button'
import { encodeAbsoluteDateQueryValue, extractDateFromGlideScript, operatorUsageMap } from '@kit/utils/date-helper'

type SnValueDateProps = {
  value: string
  operator: string // 'ON' | 'NOTON' | '<' | '<=' | '>' | '>='
  onChange: (val: string) => void
  isDateTime?: boolean
}

export function SnValueDate({ value, operator, onChange, isDateTime }: SnValueDateProps) {
  const { dateMeta } = useCondMeta()
  const [localValue, setLocalValue] = useState<string>('')
  const [customDates, setCustomDates] = useState<string[]>([])
  const [showCalendar, setShowCalendar] = useState(false)

  const usage = operatorUsageMap[operator]

  useEffect(() => {
  if (value === '') {
    setLocalValue('')
    setCustomDates([])
    setShowCalendar(false)
  }
}, [value, operator])


  const options = useMemo(() => {
    return Object.entries(dateMeta?.dateChoiceModel ?? {}).map(([key, meta]) => ({
      key,
      value: meta.value,
      label: meta.label,
    }))
  }, [dateMeta])

  useEffect(() => {
    if (!dateMeta || !value) return

    const matchKey = Object.entries(dateMeta.timeAgoDates).find(([, entry]) => {
      if (usage === 'before') return entry.before === value
      if (usage === 'after') return entry.after === value
      if (usage === 'both') {
        const parts = value.split('@')
        return parts.length === 3 && parts[1] === entry.before && parts[2] === entry.after
      }
      return false
    })?.[0]

    if (matchKey) return setLocalValue(matchKey)

    const rawDate = extractDateFromGlideScript(value)
    if (rawDate) {
      const formatted = isDateTime ? `${rawDate} 00:00:00` : rawDate
      setCustomDates(prev => Array.from(new Set([...prev, formatted])))
      setLocalValue(`custom:${formatted}`)
    }
  }, [value, dateMeta, usage, isDateTime])

  useEffect(() => {
    if (!operator || !dateMeta || !localValue) return

    if (localValue.startsWith('custom:')) {
      const val = localValue.replace('custom:', '')
      const formattedVal = encodeAbsoluteDateQueryValue(operator, val)
      if (formattedVal !== value) onChange(formattedVal)
      return
    }

    const entry = dateMeta.timeAgoDates[localValue]
    if (!entry) return
    const label = entry.label ?? localValue

    let nextVal = ''
    switch (usage) {
      case 'before':
        nextVal = entry.before
        break
      case 'after':
        nextVal = entry.after
        break
      case 'both':
        nextVal = `${label}@${entry.before}@${entry.after}`
        break
    }

    if (nextVal !== value) onChange(nextVal)
  }, [operator, localValue, value, dateMeta, usage, onChange])

  const handleChange = (key: string) => {
    setLocalValue(key)
  }

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return
    const formatted = isDateTime ? format(date, 'yyyy-MM-dd HH:mm:ss') : format(date, 'yyyy-MM-dd')
    const customKey = `custom:${formatted}`
    setLocalValue(customKey)
    setCustomDates(Array.from(new Set([formatted])))
    setShowCalendar(false)
  }

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    setCustomDates([])
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="w-full relative">
          <Select value={localValue} onValueChange={handleChange} disabled={!dateMeta}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose relative date" />
            </SelectTrigger>
            <SelectContent>
              {customDates.map(d => (
                <SelectItem key={d} value={`custom:${d}`}>
                  {d}
                </SelectItem>
              ))}
              {options.map(option => (
                <SelectItem key={option.key} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {localValue && (
            <X
              className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive"
              onClick={handleClear}
            />
          )}
        </div>

        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              title="Pick a custom date"
              onClick={() => setShowCalendar(prev => !prev)}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-auto">
            <Calendar mode="single" selected={undefined} onSelect={handleCustomDateSelect} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
