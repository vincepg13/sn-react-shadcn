import { GlideUser } from '@kit/lib/g-user'
import { GlideAjax } from '@kit/lib/glide-ajax'
import { GlideRecord } from '@kit/lib/glide-record'
import { SnClientScript, SnPolicyScript } from '@kit/types/form-schema'
import { GlideUserSchema } from '@kit/types/client-scripts'
import { useCallback, useEffect, useMemo, useRef } from 'react'

type ScriptParams = {
  gForm: unknown
  scope: string
  glideUser: GlideUserSchema
  messages: Record<string, string>
  scratchpad: Record<string, unknown>
}

function mapCsTypeToMethod(type: 'onChange' | 'onSubmit' | 'onLoad') {
  const methodMap = {
    onChange: 'onChange(control, oldValue, newValue, isLoading, isTemplate);',
    onSubmit: 'onSubmit();',
    onLoad: 'onLoad();',
  }
  return methodMap[type]
}

export function useScriptRunner({ gForm, glideUser, scratchpad, messages, scope }: ScriptParams) {
  //Helper to get localized message

  const getMessage = useCallback((key: string) => messages[key] || '', [messages])

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

  const executePolicyScript = useCallback(
    (script?: SnPolicyScript) => {
      if (!script) return
      try {
        const func = new Function(
          `const g_form = arguments[0];
            \nconst g_user = arguments[1];
            \nconst g_scratchpad = arguments[2];
            \nconst getMessage = arguments[3];
            \nconst GlideAjax = arguments[4];
            \nconst GlideRecord = arguments[5];
            \n${script.script};
            \nreturn onCondition()`
        )

        return func(gForm, g_user, scratchpad, getMessage, ScopedGlideAjax, ControlledGlideRecord)
      } catch (e) {
        console.error(`Failed to run policy script [${script.name}]`, e)
      }
    },
    [gForm, g_user, scratchpad, getMessage, ScopedGlideAjax, ControlledGlideRecord]
  )

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
            \nreturn ${mapCsTypeToMethod(script.type)}`
        )

        return func(
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

  return { executePolicyScript, executeClientScript }
}
