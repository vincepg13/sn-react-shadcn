import { useMemo } from 'react'
import { z, ZodTypeAny } from 'zod'
import { mapFieldToZod } from '@kit/utils/form-zod'
import { toSafe } from '@kit/components/sn-form/hooks/useDotSafeForm'
import type { FieldUIState, SnFieldsSchema } from '@kit/types/form-schema'

export function createCatalogFormSchema(
  fields: SnFieldsSchema,
  fieldUIState: Record<string, FieldUIState>
) {
  const shape: Record<string, ZodTypeAny> = {}

  for (const field of Object.values(fields)) {
    const override = fieldUIState[field.name] as Partial<FieldUIState> | undefined
    const visible = override?.visible ?? field.visible
    const mandatory = visible && (override?.mandatory ?? field.mandatory)

    if (field.type === 'boolean' && mandatory) {
      shape[toSafe(field.name)] = z
        .union([z.boolean(), z.literal('true'), z.literal('false')])
        .transform(value => value === true || value === 'true')
        .refine(value => value, { message: 'This confirmation is required' })
      continue
    }

    shape[toSafe(field.name)] = mapFieldToZod({ ...field, mandatory })
  }

  return z.object(shape)
}

export function useCatalogFormSchema(
  fields: SnFieldsSchema,
  fieldUIState: Record<string, FieldUIState>
) {
  return useMemo(() => createCatalogFormSchema(fields, fieldUIState), [fieldUIState, fields])
}
