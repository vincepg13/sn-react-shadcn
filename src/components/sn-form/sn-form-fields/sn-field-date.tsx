import { format, isValid } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Button } from '../../ui/button'
import { Calendar } from '../../ui/calendar'
import { SnFieldBaseProps } from '../../../types/form-schema'
import { useFieldUI } from '../contexts/FieldUIContext'
import { cn } from '../../../lib/utils'
import { SnFieldSchema } from '../../../types/form-schema'
import { useState, ChangeEvent } from 'react'
import { XCircle } from 'lucide-react'
import { useFormLifecycle } from '../contexts/SnFormLifecycleContext'

export function SnFieldDate({ field, rhfField, onChange }: SnFieldBaseProps<string> & { field: SnFieldSchema }) {
  const { readonly } = useFieldUI()
  const { formConfig } = useFormLifecycle()
  const isDateTime = field.type === 'glide_date_time'

  const rawValue = rhfField.value
  const maybeDate =
    typeof rawValue === 'string' && rawValue.trim() !== ''
      ? new Date(rawValue.includes(' ') ? rawValue.replace(' ', 'T') : rawValue)
      : undefined

  const selectedDate = maybeDate && isValid(maybeDate) ? maybeDate : undefined

  // Time state for glide_date_time
  const [selectedTime, setSelectedTime] = useState(() => {
    if (!isDateTime || !selectedDate) return '00:00:00'
    const hours = String(selectedDate.getHours()).padStart(2, '0')
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0')
    const seconds = String(selectedDate.getSeconds()).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  })

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return

    if (isDateTime) {
      const [hh, mm, ss] = selectedTime.split(':')
      date.setHours(Number(hh))
      date.setMinutes(Number(mm))
      date.setSeconds(Number(ss))
    }

    let formatted = '',
      displayFormat = ''
    if (isDateTime) {
      formatted = format(date, 'yyyy-MM-dd HH:mm:ss')
      displayFormat = format(date, formConfig.date_format + ' HH:mm:ss')
    } else {
      formatted = format(date, 'yyyy-MM-dd')
      displayFormat = format(date, formConfig.date_format)
    }

    onChange(formatted, displayFormat)
  }

  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setSelectedTime(time + ':00')

    if (selectedDate) {
      const [hh, mm] = time.split(':')
      const updated = new Date(selectedDate)
      updated.setHours(Number(hh))
      updated.setMinutes(Number(mm))
      updated.setSeconds(0)

      const formatted = format(updated, 'yyyy-MM-dd HH:mm:ss')
      const displayFormat = format(updated, formConfig.date_format + ' HH:mm:ss')
      onChange(formatted, displayFormat)
    }
  }

  return (
    <div className={`${readonly ? 'cursor-not-allowed' : ''}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={readonly}
            className={cn(
              'w-full justify-start text-left font-normal',
              readonly && 'cursor-not-allowed',
              !selectedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, isDateTime ? 'PPP p' : 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 space-y-3" align="start">
          <Calendar mode="single" selected={selectedDate} onSelect={handleDateChange} className="p-0" initialFocus />
          {isDateTime && (
            <input
              type="time"
              step="60"
              value={selectedTime.slice(0, 5)} // show HH:mm only
              onChange={handleTimeChange}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          )}
          {rhfField.value && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-center justify-center items-center"
              onClick={() => {
                onChange('')
                setSelectedTime('00:00:00')
              }}
            >
              <XCircle className="text-red-500 size-5" />
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
