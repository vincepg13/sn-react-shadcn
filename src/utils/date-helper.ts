import { parse } from 'date-fns'

const utcDate = 'yyyy-MM-dd';
const utcDateTime = 'yyyy-MM-dd HH:mm:ss';

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