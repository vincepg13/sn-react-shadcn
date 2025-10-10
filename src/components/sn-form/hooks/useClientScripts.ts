/* eslint-disable @typescript-eslint/no-explicit-any */
import { setActionName } from '../../../lib/g-form'
import { getDefaultValue } from '@kit/utils/form-client'
import { useCallback, useEffect } from 'react'
import { SnClientScript, SnFieldsSchema } from '@kit/types/form-schema'

type CsParams = {
  form: any
  clientScripts: SnClientScript[]
  formFields: SnFieldsSchema | null
  executeClientScript: (script: SnClientScript, params: Record<string, any>) => any
}

export function useClientScripts({ form, clientScripts, formFields, executeClientScript }: CsParams) {
  //Execute client script for field change
  const runClientScriptsForFieldChange = useCallback(
    (fieldName: string, oldValue: any, newValue: any, isLoading = false) => {
      const matchingScripts = clientScripts.filter(s => s.type === 'onChange' && s.fieldName === fieldName)

      for (const script of matchingScripts) {
        executeClientScript(script, { fieldName, oldValue, newValue, isLoading })
      }
    },
    [clientScripts, executeClientScript]
  )

  //Execute onLoad client scripts
  const runOnLoadClientScripts = useCallback(() => {
    const onLoadScripts = clientScripts.filter(s => s.type === 'onLoad' && s.tableName != 'global')

    for (const script of onLoadScripts) {
      executeClientScript(script, {})
    }
  }, [clientScripts, executeClientScript])

  //Execute onSubmit client scripts
  const runOnSubmitClientScripts = useCallback(
    (action: string) => {
      setActionName(action)
      const onSubmitScripts = clientScripts.filter(s => s.type === 'onSubmit')

      for (const script of onSubmitScripts) {
        const res = executeClientScript(script, {})
        if (res === false) return false
      }

      return true
    },
    [clientScripts, executeClientScript]
  )

  //Initial load trigger onload and onchange
  useEffect(() => {
    if (!formFields) return

    const values = Object.fromEntries(Object.values(formFields).map(f => [f.name, getDefaultValue(f)]))

    form.reset(values)

    Object.entries(values).forEach(([fieldName, value]) => {
      runClientScriptsForFieldChange(fieldName, undefined, value, true)
    })

    runOnLoadClientScripts()
  }, [formFields, form, runClientScriptsForFieldChange, runOnLoadClientScripts])

  return {
    clientScripts,
    runClientScriptsForFieldChange,
    runOnLoadClientScripts,
    runOnSubmitClientScripts,
  }
}
