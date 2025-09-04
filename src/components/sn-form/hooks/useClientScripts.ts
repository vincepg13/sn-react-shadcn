/* eslint-disable @typescript-eslint/no-explicit-any */
import { GlideAjax } from '../../../lib/glide-ajax'
import { getDefaultValue } from '@kit/utils/form-client'
import { GlideUserSchema } from '@kit/types/client-scripts'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SnClientScript, SnFieldsSchema } from '@kit/types/form-schema'
import { GlideUser } from '@kit/lib/g-user'
import { GlideRecord } from '@kit/lib/glide-record'

type CsParams = {
  form: any
  clientScripts: SnClientScript[]
  formFields: SnFieldsSchema | null
  gForm: any
  scope: string
  glideUser: GlideUserSchema
  messages: Record<string, string>
  scratchpad: Record<string, unknown>
}

export function useClientScripts({
  form,
  clientScripts,
  formFields,
  gForm,
  scope,
  glideUser,
  messages,
  scratchpad,
}: CsParams) {
  //Single Abort Controller Ref for hook lifecyle for any async operations
  const controllerRef = useRef<AbortController>(new AbortController())

  useEffect(() => {
    if (controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController()
    }
    return () => controllerRef.current.abort()
  }, [])

  const g_user = useMemo(() => {
    return new GlideUser(glideUser)
  }, [glideUser])

  // Initialise scope for GlideAjax
  const ScopedGlideAjax = useMemo(() => {
    return class extends GlideAjax {
      constructor(processor: string) {
        super(processor, controllerRef.current)
        if (scope) this.setScope(scope)
      }
    }
  }, [scope])

  //Inject controller into client side GlideRecord
  const ControlledGlideRecord = useMemo(() => {
    return class extends GlideRecord {
      constructor(table: string) {
        super(table, controllerRef.current)
      }
    }
  }, [])

  //Helper to get localized message
  const getMessage = useCallback((key: string) => messages[key] || '', [messages])

  //Execute any client script
  const executeClientScript = useCallback(
    (
      script: SnClientScript,
      context: {
        fieldName?: string
        oldValue?: string
        newValue?: string
        isLoading?: boolean
      }
    ) => {
      try {
        const func = new Function(
          'control',
          'oldValue',
          'newValue',
          'isLoading',
          'isTemplate',
          `const g_form = arguments[5];
          \nconst g_user = arguments[6];
          \nconst g_scratchpad = arguments[7];
          \nconst getMessage = arguments[8];
          \nconst GlideAjax = arguments[9];
          \nconst GlideRecord = arguments[10];
          \n${script.script};
          \nreturn ${
            script.type === 'onChange' ? 'onChange(control, oldValue, newValue, isLoading, isTemplate);' : 'onLoad();'
          }`
        )

        func(
          null,
          context.oldValue?.toString(),
          context.newValue?.toString(),
          context.isLoading ?? false,
          false,
          gForm,
          g_user,
          scratchpad,
          getMessage,
          ScopedGlideAjax,
          ControlledGlideRecord
        )
      } catch (e) {
        console.error(`Failed to run client script [${script.type}]`, e)
      }
    },
    [gForm, g_user, scratchpad, getMessage, ScopedGlideAjax, ControlledGlideRecord]
  )

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

  // Execute onLoad client scripts
  const runOnLoadClientScripts = useCallback(() => {
    const onLoadScripts = clientScripts.filter(s => s.type === 'onLoad' && s.tableName != 'global')

    for (const script of onLoadScripts) {
      executeClientScript(script, {})
    }
  }, [clientScripts, executeClientScript])

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
  }
}
