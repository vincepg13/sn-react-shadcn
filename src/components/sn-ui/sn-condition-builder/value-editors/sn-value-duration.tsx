import { SnFieldDurationCore } from '@kit/components/sn-form/sn-form-fields/sn-field-duration'
import { SnConditionField } from '@kit/types/condition-schema'

type DurProps = {
  value: string
  field: SnConditionField
  onChange: (value: string) => void
}

function parseDuration(value: string): string {
  const match = value.match(/gs\.getDurationDate\('([^']*)'\)/)
  if (!match) return '1970-01-01 00:00:00'

  const durationStr = match[1].trim()
  const [dayPart, timePart = '0:0:0'] = durationStr.includes(' ') ? durationStr.split(' ') : ['0', durationStr]
  const [hours = '0', minutes = '0', seconds = '0'] = timePart.split(':')

  const days = +dayPart || 0
  const hrs = +hours || 0
  const mins = +minutes || 0
  const secs = +seconds || 0

  const epoch = new Date(0)
  epoch.setUTCDate(epoch.getUTCDate() + days)
  epoch.setUTCHours(epoch.getUTCHours() + hrs)
  epoch.setUTCMinutes(epoch.getUTCMinutes() + mins)
  epoch.setUTCSeconds(epoch.getUTCSeconds() + secs)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${epoch.getUTCFullYear()}-${pad(epoch.getUTCMonth() + 1)}-${pad(epoch.getUTCDate())} ${pad(
    epoch.getUTCHours()
  )}:${pad(epoch.getUTCMinutes())}:${pad(epoch.getUTCSeconds())}`
}

export function SnValueDuration({ value, field, onChange }: DurProps) {
  const durField = { mandatory: false, readonly: false, ...field }
  const parseDurationdValue = parseDuration(value)

  const handleChange = (_val: string, splits?: string[]) => {
    const formattedValue =
      splits && splits.length == 4
        ? `javascript:gs.getDurationDate('${splits[0]} ${splits[1]}:${splits[2]}:${splits[3]}')`
        : ''
    onChange(formattedValue)
  }

  return <SnFieldDurationCore field={durField} fVal={parseDurationdValue} size="sm" onChange={handleChange} />
}
