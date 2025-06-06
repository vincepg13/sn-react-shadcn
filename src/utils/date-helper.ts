import { parse } from 'date-fns'

const utcDate = 'yyyy-MM-dd';
const utcDateTime = 'yyyy-MM-dd HH:mm:ss';

export const operatorUsageMap: Record<string, 'before' | 'after' | 'both'> = {
  ON: 'both',
  NOTON: 'both',
  '<': 'before',
  '<=': 'before',
  '>': 'after',
  '>=': 'after',
}

export function extractDateFromGlideScript(val: string): string | null {
  const match = val.match(/dateGenerate\('(\d{4}-\d{2}-\d{2})','\d{2}:\d{2}:\d{2}'\)/)
  return match?.[1] ?? null
}

export function encodeAbsoluteDateQueryValue(operator: string, date: string): string {
  const [yyyy, mm, dd] = date.split(' ')[0].split('-')
  const hasTime = date.includes(' ')
  const timePart = hasTime ? date.split(' ')[1] : null

  const dateOnly = `${yyyy}-${mm}-${dd}`
  const startOfDay = `javascript:gs.dateGenerate('${dateOnly}','00:00:00')`
  const endOfDay = `javascript:gs.dateGenerate('${dateOnly}','23:59:59')`

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
      return hasTime ? `javascript:gs.dateGenerate('${dateOnly}','${timePart}')` : startOfDay
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
  } catch(e) {
    console.error('Error parsing date:', e)
    return false
  }
}