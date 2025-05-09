import { useMemo } from 'react'
import { SnFieldSchema } from '@kit/types/form-schema';

export function useReferenceSelected(field: SnFieldSchema): { value: string[]; display: string[] } {
  const value = useMemo(() => {
    if (!field.value) return []
    return typeof field.value === 'string' ? field.value.split(',') : field.value
  }, [field.value])

  const display = useMemo(() => {
    if (Array.isArray(field.displayValue)) return field.displayValue
    return field.displayValue?.split(',') || []
  }, [field.displayValue])

  return { value, display }
}
