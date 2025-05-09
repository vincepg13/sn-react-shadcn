/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from 'react';
import { SnClientScript, SnFieldsSchema } from '@kit/types/form-schema';
import { getDefaultValue } from '@kit/utils/form-client';

export function useClientScripts({
  form,
  clientScripts,
  formFields,
  gForm,
}: {
  form: any;
  clientScripts: SnClientScript[];
  formFields: SnFieldsSchema | null;
  gForm: any;
}) {

  //Execute any client script
  const executeClientScript = useCallback(
    (
      script: SnClientScript,
      context: {
        fieldName?: string;
        oldValue?: any;
        newValue?: any;
        isLoading?: boolean;
      }
    ) => {
      try {
        const func = new Function(
          'control',
          'oldValue',
          'newValue',
          'isLoading',
          'isTemplate',
          `const g_form = arguments[5];\n${script.script};\nreturn ${
            script.type === 'onChange' ? 'onChange(control, oldValue, newValue, isLoading, isTemplate);' : 'onLoad();'
          }`
        );

        func(
          null,
          context.oldValue,
          context.newValue,
          context.isLoading ?? false,
          false,
          gForm
        );
      } catch (e) {
        console.error(`Failed to run client script [${script.type}]`, e);
      }
    },
    [gForm]
  );

  //Execute client script for field change
  const runClientScriptsForFieldChange = useCallback(
    (fieldName: string, oldValue: any, newValue: any, isLoading = false) => {
      const matchingScripts = clientScripts.filter(
        (s) => s.type === 'onChange' && s.fieldName === fieldName
      );

      for (const script of matchingScripts) {
        executeClientScript(script, { fieldName, oldValue, newValue, isLoading });
      }
    },
    [clientScripts, executeClientScript]
  );

  // Execute onLoad client scripts
  const runOnLoadClientScripts = useCallback(() => {
    const onLoadScripts = clientScripts.filter((s) => s.type === 'onLoad' && s.tableName != "global");

    for (const script of onLoadScripts) {
      executeClientScript(script, {});
    }
  }, [clientScripts, executeClientScript]);

  //Initial load trigger onload and onchange
  useEffect(() => {
    if (!formFields) return;

    const values = Object.fromEntries(
      Object.values(formFields).map((f) => [f.name, getDefaultValue(f)])
    );

    form.reset(values);

    Object.entries(values).forEach(([fieldName, value]) => {
      runClientScriptsForFieldChange(fieldName, undefined, value, true);
    });

    runOnLoadClientScripts();
  }, [formFields, form, runClientScriptsForFieldChange, runOnLoadClientScripts]);

  return {
    clientScripts,
    runClientScriptsForFieldChange,
    runOnLoadClientScripts,
  };
}
