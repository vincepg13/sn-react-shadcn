/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { SnClientScript, FieldUIState, SnFieldsSchema } from "@kit/types/form-schema";
import { createGFormBridge } from "@kit/utils/form-client";
import { getDefaultValue } from "@kit/utils/form-client";

export function useClientScripts({
  form,
  table,
  guid,
  formFields,
  updateFieldUI,
}: {
  form: any;
  table: string;
  guid: string;
  formFields: SnFieldsSchema | null;
  updateFieldUI: (field: string, updates: Partial<FieldUIState>) => void;
}) {
  const [clientScripts, setClientScripts] = useState<SnClientScript[]>([]);

  const runClientScriptsForFieldChange = useCallback(
    (fieldName: string, oldValue: any, newValue: any, isLoading = false) => {
      const g_form = createGFormBridge(form.getValues, form.setValue, updateFieldUI, table, guid);
      const matchingScripts = clientScripts.filter(
        s => s.type === "onChange" && s.fieldName === fieldName
      );

      for (const script of matchingScripts) {
        try {
          const func = new Function(
            "control",
            "oldValue",
            "newValue",
            "isLoading",
            "isTemplate",
            `const g_form = arguments[5];\n${script.script};\nreturn onChange(control, oldValue, newValue, isLoading, isTemplate);`
          );

          func(null, oldValue, newValue, isLoading, false, g_form);
        } catch (e) {
          console.error(`Failed to run client script for ${fieldName}:`, e);
        }
      }
    },
    [clientScripts, form.getValues, form.setValue, guid, table]
  );

  // Initial load trigger
  useEffect(() => {
    if (!formFields) return;

    const values = Object.fromEntries(
      Object.values(formFields).map(f => [f.name, getDefaultValue(f)])
    );

    form.reset(values);

    Object.entries(values).forEach(([fieldName, value]) => {
      runClientScriptsForFieldChange(fieldName, undefined, value, true);
    });
  }, [formFields, guid, form]);

  return {
    clientScripts,
    setClientScripts,
    runClientScriptsForFieldChange,
  };
}
