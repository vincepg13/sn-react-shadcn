import { DateMetaArray, SnConditionField, SnConditionRow } from '@kit/types/condition-schema'
import { SnValueFieldName } from './sn-value-field-name'
import { useCondMeta } from '../contexts/SnConditionsContext'
import { Input } from '@kit/components/ui/input'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@kit/components/ui/popover'
import { Button } from '@kit/components/ui/button'
import { Label } from '@kit/components/ui/label'
import { SnValueChoice } from './sn-value-choice'

type SnValueDateCompProps = {
  field: SnConditionField
  condition: SnConditionRow
  onChange: (value: string) => void
}

export function SnValueDateComparative({ field, condition, onChange }: SnValueDateCompProps) {
  const { dateMeta } = useCondMeta()
  const durations = dateMeta?.trendValuesWithFieldsPlural.map(d => ({
    label: d[0],
    value: d[1],
  }))

  const parts = condition.value?.split('@') || []
  const compareParts = condition.value?.replace(`${parts[0]}@`, '')
  const [comparator, setComparator] = useState<string>(compareParts || '')
  const [equivalentField, setEquivalentField] = useState<string>(parts[0] || '')

  useEffect(() => {
    onChange(`${equivalentField}@${comparator}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparator, equivalentField])

  if (!dateMeta || !durations) return <Input disabled={true} className="w-full" placeholder="Loading..." />

  return (
    <div className="flex items-center gap-2">
      <SnDateCompare
        value={comparator}
        durations={dateMeta.trendValuesWithFieldsPlural}
        compareTypes={dateMeta.comparativeTypes}
        onChange={setComparator}
      />
      <SnValueFieldName
        field={field}
        table={condition.table}
        value={equivalentField}
        clearable={false}
        onChange={setEquivalentField}
      />
    </div>
  )
}

function SnDateCompare({
  value,
  durations,
  compareTypes,
  onChange,
}: {
  value: string
  durations: DateMetaArray
  compareTypes: DateMetaArray
  onChange: (value: string) => void
}) {
  const parts = value.split('@')
  const [duration, setDuration] = useState<string>(parts[0] || '')
  const [comparator, setComparator] = useState<string>(parts[1] || '')
  const [durVal, setDurVal] = useState<number | null>(parts[2] ? +parseInt(parts[2]) : null)

  const durChoice = durations?.find(d => d[1] === duration)
  const displayVal = durVal && durChoice && comparator ? `${durVal || ''} ${durChoice[0]} ${comparator}`.trim() : ''

  useEffect(() => {
    if (durVal && duration && comparator) {
      onChange(`${duration}@${comparator}@${durVal} `)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durVal, duration, comparator])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          {displayVal ? <span>{displayVal}</span> : <span className="text-muted-foreground">-- Select Option --</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="leading-none font-medium">Date Comparison</h4>
            <p className="text-muted-foreground text-sm">Set the values for a date comparison.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="val">Value</Label>
              <Input
                id="val"
                type="number"
                step="1"
                min="0"
                value={durVal ?? ''}
                onChange={e => {
                  const val = e.target.value
                  if (val === '' || /^\d+$/.test(val)) setDurVal(isNaN(+val) ? null : +val)
                }}
                className="col-span-2 h-8"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label>Duration</Label>
              <div className="col-span-2 h-8">
                <SnValueChoice
                  value={duration}
                  size="sm"
                  clearable={false}
                  choices={durations.map(d => ({ label: d[0], value: d[1] }))}
                  onChange={setDuration}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="height">Comparison</Label>
              <div className="col-span-2 h-8">
                <SnValueChoice
                  value={comparator}
                  size="sm"
                  clearable={false}
                  choices={compareTypes.map(d => ({ label: d[0], value: d[1] }))}
                  onChange={setComparator}
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
