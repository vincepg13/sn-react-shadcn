import { useMemo } from 'react';
import { z, ZodTypeAny } from 'zod';
import { FieldUIState, SnFieldsSchema } from '@kit/types/form-schema';
import { mapFieldToZod } from '@kit/utils/form-zod';

export function useZodFormSchema(formFields: SnFieldsSchema, fieldUIState: Record<string, FieldUIState> | undefined) {
  return useMemo(() => {
    if (!formFields) return null;

    const shape: Record<string, ZodTypeAny> = {};
    for (const field of Object.values(formFields)) {
      const overrides = (fieldUIState?.[field.name] ?? {}) as Partial<FieldUIState>;
      const effectiveField = {
        ...field,
        mandatory: overrides.mandatory ?? field.mandatory,
      };
      shape[field.name] = mapFieldToZod(effectiveField);
    }

    return z.object(shape);
  }, [formFields, fieldUIState]);
}