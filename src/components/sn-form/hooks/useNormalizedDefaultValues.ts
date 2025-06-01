/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from 'react';
import { SnFieldsSchema } from '@kit/types/form-schema';

export function useNormalizedDefaultValues(formFields: SnFieldsSchema) {
  const buildNormalizedValues = useCallback(
    (fields: SnFieldsSchema, currentValues: Record<string, any>) => {
      const values: Record<string, any> = { ...currentValues };

      for (const field of Object.values(fields)) {
        const fieldValue = currentValues[field.name];

        if (field.type === 'user_image') {
          const hasDisplayValueMismatch =
            field.displayValue && (!fieldValue || !field.displayValue.startsWith(fieldValue));

          if (hasDisplayValueMismatch) {
            values[field.name] = field.displayValue.replace(/\.iix$/, '');
          }
        }
      }

      return values;
    },
    []
  );

  const defaultValues = useMemo(() => {
    const raw = Object.fromEntries(Object.entries(formFields).map(([name, field]) => [name, field.value ?? '']));
    return buildNormalizedValues(formFields, raw);
  }, [formFields, buildNormalizedValues]);

  return { defaultValues, buildNormalizedValues };
}