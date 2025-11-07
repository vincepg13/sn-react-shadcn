import { ComboInput } from '@kit/components/ui/combo-input'
import { SnFieldBaseProps } from '@kit/types/form-schema'
import { useEffect, useState } from 'react'
import { useFieldUI } from '../contexts/FieldUIContext'

const EPOCH_DATE = new Date('1970-01-01T00:00:00Z')

interface SnFieldDurProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: { mandatory: boolean; readonly: boolean }
}

type SnFieldDurCoreProps = {
  fVal: string
  readonly?: boolean
  size?: 'sm' | 'default'
  field: { mandatory: boolean; readonly: boolean }
  onChange: (value: string, displayValue?: string, splits?: string[]) => void
}

export function SnFieldDuration({ field, rhfField, onChange }: SnFieldDurProps) {
  const { readonly } = useFieldUI()

  const dualChange = (value: string, displayValue?: string) => {
    onChange?.(value, displayValue)
    rhfField.onChange(value)
  }

  return <SnFieldDurationCore field={field} readonly={readonly} fVal={rhfField.value as string} onChange={dualChange} />
}

export function SnFieldDurationCore({ field, fVal, readonly, size = 'default', onChange }: SnFieldDurCoreProps) {
  const [splits, setSplits] = useState(['', '', '', ''])

  useEffect(() => {
    if (!fVal) return setSplits(['', '', '', ''])

    const [datePart, timePart] = fVal.split(' ')
    const [hh, mm, ss] = timePart?.split(':') ?? ['00', '00', '00']

    const date = new Date(`${datePart}T00:00:00Z`)
    const diffTime = date.getTime() - EPOCH_DATE.getTime()
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    setSplits([String(days), hh, mm, ss])
  }, [fVal])

  const formatValue = (values: string[]): string => {
    if (!values[0] && !values[1] && !values[2] && !values[3]) return ''

    const dayCount = parseInt(values[0]) || 0
    const date = new Date(EPOCH_DATE.getTime() + dayCount * 86400000)
    const yyyy = date.getUTCFullYear()
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(date.getUTCDate()).padStart(2, '0')

    const time = values
      .slice(1)
      .map(t => t.padStart(2, '0'))
      .join(':')

    return `${yyyy}-${mm}-${dd} ${time}`
  }

  const toDisplayValue = (splits: string[]): string => {
    const [d, h, m, s] = splits.map(v => parseInt(v) || 0)
    const parts = []

    if (d) parts.push(`${d} ${d === 1 ? 'day' : 'days'}`)
    if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`)
    if (m) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
    if (s) parts.push(`${s} ${s === 1 ? 'second' : 'seconds'}`)

    return parts.length > 0 ? parts.join(' ') : '0 seconds'
  }

  const clamp = (i: number, value: number) => {
    if (i === 1) return Math.min(Math.max(value, 0), 99) // hours
    if (i === 2 || i === 3) return Math.min(Math.max(value, 0), 59) // min/sec
    return value // days
  }

  const updateValue = (updatedSplits: string[]) => {
    const value = formatValue(updatedSplits)
    const display = toDisplayValue(updatedSplits)
    onChange(value, display, updatedSplits)
  }

  const handleChange = (i: number, value: string) => {
    const num = parseInt(value)
    const clamped = isNaN(num) ? '' : String(clamp(i, num))
    const newSplits = [...splits]
    newSplits[i] = clamped
    setSplits(newSplits)
    updateValue(newSplits)
  }

  const minWidths = ['75px', '60px', '60px', '60px']

  const getInputClasses = (i: number) => {
    let inputClasses = 'ta-custom'
    const startCellPadder = size === 'sm' ? 'p-0 pl-2' : ''
    const endCellPadder = size === 'sm' ? 'p-0' : ''

    if (i === 0) inputClasses += ` rounded-sm mr-1 text-end ${startCellPadder}`
    if (i === 1) inputClasses += ` rounded-none rounded-l-sm ${startCellPadder}`
    if (i === 2)
      inputClasses += ` rounded-none border-l-0 border-r-0 focus-within:border-l focus-within:border-r ${endCellPadder}`
    if (i === 3) inputClasses += ` rounded-none rounded-r-sm ${endCellPadder}`

    return inputClasses
  }

  return (
    <div className={`flex ${readonly ? 'cursor-not-allowed' : ''}`}>
      {splits.map((val, i) => (
        <div key={i} className="flex items-center gap-1">
          <ComboInput
            type="number"
            min={0}
            value={val}
            required={field.mandatory}
            disabled={readonly}
            onChange={e => handleChange(i, e.target.value)}
            className={getInputClasses(i)}
            innerClass="text-center"
            style={{ minWidth: minWidths[i] }}
            startContent={i === 0 ? 'Days' : i === 1 ? 'Hours' : ''}
          />
        </div>
      ))}
    </div>
  )
}
