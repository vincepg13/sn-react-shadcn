import { getDateViaFormat, isDateOn, isDateBetween } from './date-helper'
import { SnPolicyCondition, SnFormConfig } from '@kit/types/form-schema'
import { fieldTypeMap } from '../types/predicate-definitions'

function evalLessThan(fieldVal: string, condVal: string, type: string, dateFormat: string): boolean {
  switch (type) {
    case 'date':
      return new Date(fieldVal).getTime() < getDateViaFormat(condVal, dateFormat).getTime()
    case 'numeric':
      return Number(fieldVal) < Number(condVal)
    case 'string':
    default:
      return String(fieldVal) < String(condVal)
  }
}

function evalLessThanOrEqual(fieldVal: string, condVal: string, type: string, dateFormat: string): boolean {
  switch (type) {
    case 'date':
      return new Date(fieldVal).getTime() <= getDateViaFormat(condVal, dateFormat).getTime()
    case 'numeric':
      return Number(fieldVal) <= Number(condVal)
    case 'string':
    default:
      return String(fieldVal) <= String(condVal)
  }
}

function evalGreaterThan(fieldVal: string, condVal: string, type: string, dateFormat: string): boolean {
  switch (type) {
    case 'date':
      return new Date(fieldVal).getTime() > getDateViaFormat(condVal, dateFormat).getTime()
    case 'numeric':
      return Number(fieldVal) > Number(condVal)
    case 'string':
    default:
      return String(fieldVal) > String(condVal)
  }
}

function evalGreaterThanOrEqual(fieldVal: string, condVal: string, type: string, dateFormat: string): boolean {
  switch (type) {
    case 'date':
      return new Date(fieldVal).getTime() >= getDateViaFormat(condVal, dateFormat).getTime()
    case 'numeric':
      return Number(fieldVal) >= Number(condVal)
    case 'string':
    default:
      return String(fieldVal) >= String(condVal)
  }
}

function evalBetween(fieldVal: string, condVal: string, type: string, dateFormat: string): boolean {
  const [min, max] = condVal.split('@')
  switch (type) {
    case 'date':
      return isDateBetween(min, max, fieldVal, dateFormat)
    case 'numeric': {
      const val = Number(fieldVal)
      return val >= Number(min) && val <= Number(max)
    }
    case 'string':
    default:
      return String(fieldVal) >= String(min) && String(fieldVal) <= String(max)
  }
}

export function evaluateCondition(
  cond: SnPolicyCondition,
  formData: Record<string, string>,
  formConfig: SnFormConfig,
): boolean {
  
  const fieldVal = cond.dotWalkedValue || formData[cond.field]
  const condVal = cond.value
  const fieldType = fieldTypeMap[cond.type] || 'string'
  const dateFormat = formConfig.date_format + ' HH:mm:ss'


  switch (cond.oper) {
    case '=':
      return String(fieldVal) === String(condVal)
    case '!=':
      return String(fieldVal) !== String(condVal)
    case 'IN':
      return condVal.split(',').includes(String(fieldVal))
    case 'NOT IN':
      return !condVal.split(',').includes(String(fieldVal))
    case 'LIKE':
      return String(fieldVal).toLowerCase().includes(String(condVal).toLowerCase())
    case 'NOT LIKE':
      return !String(fieldVal).toLowerCase().includes(String(condVal).toLowerCase())
    case 'STARTSWITH':
      return String(fieldVal).startsWith(condVal)
    case 'ENDSWITH':
      return String(fieldVal).endsWith(condVal)
    case 'ISEMPTY':
      return fieldVal === '' || fieldVal === null || fieldVal === undefined
    case 'ISNOTEMPTY':
      return !(fieldVal === '' || fieldVal === null || fieldVal === undefined)
    case 'EMPTYSTRING':
      return String(fieldVal).trim() === ''
    case '<':
      return evalLessThan(fieldVal, condVal, fieldType, dateFormat)
    case '<=':
      return evalLessThanOrEqual(fieldVal, condVal, fieldType, dateFormat)
    case '>':
      return evalGreaterThan(fieldVal, condVal, fieldType, dateFormat)
    case '>=':
      return evalGreaterThanOrEqual(fieldVal, condVal, fieldType, dateFormat)
    case 'BETWEEN':
      return evalBetween(fieldVal, condVal, fieldType, dateFormat)
    case 'MATCH_PAT': {
      const escapedPattern = condVal.replace(/\*/g, '.*')
      const regex = new RegExp(`^${escapedPattern}$`, 'i')
      return regex.test(String(fieldVal))
    }
    case 'MATCH_RGX': {
      try {
        const regex = new RegExp(condVal)
        return regex.test(String(fieldVal))
      } catch {
        return false
      }
    }
    case 'ANYTHING':
      return fieldVal !== null && fieldVal !== undefined && String(fieldVal).trim() !== ''
    case 'SAMEAS':
    case 'NSAMEAS': {
      const compareVal = formData[condVal]
      return cond.oper === 'SAMEAS' ? fieldVal === compareVal : fieldVal !== compareVal
    }
    case 'ON': return isDateOn(condVal, fieldVal, dateFormat)
    case 'NOTON': return !isDateOn(condVal, fieldVal, dateFormat)
    default:
      console.warn(`Unsupported operator: ${cond.oper}`, cond)
      return false
  }
}