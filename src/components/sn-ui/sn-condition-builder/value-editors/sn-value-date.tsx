import { format } from 'date-fns'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { Calendar } from '@kit/components/ui/calendar'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Popover, PopoverTrigger, PopoverContent } from '@kit/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/components/ui/select'
import {
  encodeAbsoluteDateQueryValue,
  extractDateFromGlideScript,
  extractTimeFromGlideScript,
  operatorUsageMap,
} from '@kit/utils/date-helper'

type SnValueDateProps = {
  value: string
  operator: string
  onChange: (val: string, display: string) => void
  showTime?: boolean
}

export function SnValueDate({ value, operator, onChange, showTime }: SnValueDateProps) {
  const { dateMeta } = useCondMeta()
  const usage = operatorUsageMap[operator]

  const [relativeKey, setRelativeKey] = useState<string | null>(null)
  const [customDate, setCustomDate] = useState<string | null>(null)
  const [customTime, setCustomTime] = useState<string>('00:00:00')
  const [showCalendar, setShowCalendar] = useState(false)

  const relativeOptions = useMemo(() => {
    return Object.entries(dateMeta?.dateChoiceModel ?? {}).map(([key, meta]) => ({
      key,
      value: meta.value,
      label: meta.label,
    }))
  }, [dateMeta])

  // Parse incoming value
  useEffect(() => {
    if (!value || !dateMeta) return

    const matchKey = Object.entries(dateMeta.timeAgoDates).find(([, entry]) => {
      if (usage === 'before') return entry.before === value
      if (usage === 'after') return entry.after === value
      if (usage === 'both') {
        const parts = value.split('@')
        return parts.length === 3 && parts[1] === entry.before && parts[2] === entry.after
      }
      return false
    })?.[0]

    if (matchKey) {
      setRelativeKey(matchKey)
      setCustomDate(null)
      return
    }

    const rawDate = extractDateFromGlideScript(value)
    const rawTime = extractTimeFromGlideScript(value)

    if (rawDate) {
      setCustomDate(rawDate)
      setCustomTime(rawTime ?? '00:00:00')
      setRelativeKey(null)
    }
  }, [value, dateMeta, usage])

  // Emit value on changes
  useEffect(() => {
    if (!dateMeta) return

    if (relativeKey) {
      const entry = dateMeta.timeAgoDates[relativeKey]
      if (!entry) return
      const label = entry.label ?? relativeKey

      let val = ''
      switch (usage) {
        case 'before':
          val = entry.before
          break
        case 'after':
          val = entry.after
          break
        case 'between':
          val = entry.between
          break
        case 'both':
          val = `${label}@${entry.before}@${entry.after}`
          break
      }
      if (val !== value) onChange(val, label)
    }

    if (customDate && !relativeKey) {
      const val = encodeAbsoluteDateQueryValue(operator, customDate, customTime)
      if (val !== value) onChange(val, customDate + (showTime ? ` ${customTime}` : ''))
    }
  }, [relativeKey, customDate, customTime, dateMeta, usage, operator, onChange, value, showTime])

  const handleClear = () => {
    setRelativeKey(null)
    setCustomDate(null)
    onChange('', '')
  }

  const handleCustomDateSelect = (date: Date | undefined) => {
    if (!date) return
    const formatted = format(date, 'yyyy-MM-dd')
    setCustomDate(formatted)
    setRelativeKey(null)
    // setShowCalendar(false)
  }

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCustomTime(e.target.value + ':00')
  }

  const selectedCustomKey = customDate ? `custom:${customDate}${showTime ? ` ${customTime}` : ''}` : ''
  const queryVal = selectedCustomKey.replace('custom:', '')
  const customDisplay = queryVal.includes(' ') ? queryVal.slice(0, -3) : queryVal

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 w-full">
        <div className="w-full relative">
          <Select
            value={relativeKey ?? selectedCustomKey}
            onValueChange={val => {
              if (val.startsWith('custom:')) return
              setRelativeKey(val)
              setCustomDate(null)
            }}
            disabled={!dateMeta}
          >
            <SelectTrigger className="w-full relative [&_.lucide-chevron-down]:ml-[20px]">
              <div className="flex w-full items-center justify-between">
                <SelectValue placeholder="Choose relative date" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {customDate && <SelectItem value={selectedCustomKey}>{customDisplay}</SelectItem>}
              {relativeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(relativeKey || customDate) && (
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
            {showTime && (
              <input
                type="time"
                step="60"
                value={customTime.slice(0, 5)}
                onChange={handleTimeChange}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
