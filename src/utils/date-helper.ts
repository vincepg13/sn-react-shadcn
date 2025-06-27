import { parse } from 'date-fns'

const utcDate = 'yyyy-MM-dd'
const utcDateTime = 'yyyy-MM-dd HH:mm:ss'

export const operatorUsageMap: Record<string, 'before' | 'after' | 'both' | 'between'> = {
  ON: 'both',
  NOTON: 'both',
  BETWEEN: 'between',
  '<': 'before',
  '<=': 'before',
  '>': 'after',
  '>=': 'after',
}

export function extractDateFromGlideScript(script: string): string | null {
  const match = script.match(/gs\.dateGenerate\('([\d-]+)'/)
  return match ? match[1] : null
}

export function extractTimeFromGlideScript(script: string): string {
  const match = script.match(/gs\.dateGenerate\('([\d-]+)'\s*(?:,\s*'([^']+)')?\)/)
  if (!match) return ''

  const [, , time] = match

  if (time && /^\d{2}:\d{2}:\d{2}$/.test(time.trim())) {
    return time.trim()
  }

  return ''
}

export function encodeAbsoluteDateQueryValue(operator: string, date: string, time?: string): string {
  const [yyyy, mm, dd] = date.split(' ')[0].split('-')

  let startTime = '00:00:00'
  let endTime = '23:59:59'
  if (time && operator !== 'ON' && operator !== 'NOTON') {
    startTime = time
    endTime = time
  }

  const dateOnly = `${yyyy}-${mm}-${dd}`
  const startOfDay = `javascript:gs.dateGenerate('${dateOnly}','${startTime}')`
  const endOfDay = `javascript:gs.dateGenerate('${dateOnly}','${endTime}')`

  switch (operator) {
    case '<':
    case '<=':
      return `${startOfDay}`
    case '>':
    case '>=':
      return `${endOfDay}`
    case 'ON':
    case 'NOTON':
      return `${date}@${startOfDay}@${endOfDay}`
    default:
      return time ? `javascript:gs.dateGenerate('${dateOnly}','${time}')` : startOfDay
  }
}

export function getDateViaFormat(date: string, userFormat: string): Date {
  return parse(date, userFormat, new Date())
}

export function isDateBetween(start: string, end: string, fieldVal: string, userFormat: string): boolean {
  const utcFormat = fieldVal.length > 10 ? utcDateTime : utcDate

  try {
    const startDate = parse(start, userFormat, new Date())
    const endDate = parse(end, userFormat, new Date())
    const dateVal = parse(fieldVal, utcFormat, new Date())
    return dateVal >= startDate && dateVal <= endDate
  } catch (e) {
    console.error('Error parsing date:', e)
    return false
  }
}

export function isDateOn(condVal: string, fieldVal: string, userFormat: string): boolean {
  const parts = condVal.split('@')
  if (parts.length < 3) return false

  const [, startStr, endStr] = parts
  const utcFormat = fieldVal.length > 10 ? utcDateTime : utcDate

  try {
    const start = parse(startStr, userFormat, new Date())
    const end = parse(endStr, userFormat, new Date())
    const dateVal = parse(fieldVal, utcFormat, new Date())
    return dateVal >= start && dateVal <= end
  } catch (e) {
    console.error('Error parsing date:', e)
    return false
  }
}
