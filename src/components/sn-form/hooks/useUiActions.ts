/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldErrors, UseFormReturn } from 'react-hook-form'
import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSubmissionPayload, triggerNativeUIAction } from '@kit/utils/form-client'
import { SnUiAction, SnFieldsSchema, SnUiResponse, UiActionHandler } from '@kit/types/form-schema'
import { toast } from 'sonner'
import { htmlToReact } from '@kit/utils/html-parser'

type Callback = () => void | Promise<void>

type UseUiActionsParams<TFormValues extends Record<string, any> = Record<string, any>> = {
  table: string
  guid: string
  attachmentGuid: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  form: UseFormReturn<TFormValues>
  snSubmit: (guid: string) => void
  onValidationError: (errors: FieldErrors) => void
  runOnSubmitClientScripts: (action: string) => boolean
  setUiActionHandler: (fn?: UiActionHandler) => void
  snInsert?: (guid: string) => void
}

export function useUiActions<TFormValues extends Record<string, any> = Record<string, any>>(
  params: UseUiActionsParams<TFormValues>
) {
  const {
    form,
    onValidationError,
    formFields,
    table,
    guid,
    attachmentGuid,
    runOnSubmitClientScripts,
    snSubmit,
    snInsert,
    setUiActionHandler,
  } = params

  //lifecycle callback registries
  const preCallbacks = useRef<Map<string, Callback>>(new Map())
  const postCallbacks = useRef<Map<string, Callback>>(new Map())

  const registerPreUiActionCallback = useCallback((key: string, cb: Callback) => {
    preCallbacks.current.set(key, cb)
  }, [])

  const registerPostUiActionCallback = useCallback((key: string, cb: Callback) => {
    postCallbacks.current.set(key, cb)
  }, [])

  const runCallbacks = useCallback(async (type: 'pre' | 'post') => {
    const map = type === 'post' ? postCallbacks.current : preCallbacks.current
    const fns = Array.from(map.values())
    for (const fn of fns) await fn()
    map.clear()
  }, [])

  //loading state (prevent spam submissions)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  //Raw UI Action Submission Handler (no validation)
  const runUiActionRaw = useCallback(
    async (action: SnUiAction) => {
      if (loadingActionId) return
      setLoadingActionId(action.sys_id)
      try {
        const canProceed = runOnSubmitClientScripts(action.action_name)
        if (canProceed === false) return

        await runCallbacks('pre')

        const values = form.getValues()
        const payload = buildSubmissionPayload(formFields, values)

        const uiResponse = await triggerNativeUIAction({
          table,
          recordID: guid,
          attachmentGuid,
          actionSysId: action.sys_id,
          data: payload,
        })

        await runCallbacks('post')

        const uiRes = uiResponse.result as SnUiResponse
        if (uiRes?.isActionAborted) return

        if (uiRes.$$uiNotification) {
          uiRes.$$uiNotification.forEach((msg) => {
            if (msg.type === 'error') toast.error(htmlToReact(msg.message))
            if (msg.type === 'success') toast.success(htmlToReact(msg.message))
            if (msg.type === 'info') toast.info(htmlToReact(msg.message))
            else toast(htmlToReact(msg.message))
          })
        }

        if (snInsert && uiRes?.isInsert) return snInsert(uiRes.sys_id)
        snSubmit(uiRes.sys_id)
      } finally {
        setLoadingActionId(null)
      }
    },
    [
      loadingActionId,
      runOnSubmitClientScripts,
      runCallbacks,
      form,
      formFields,
      table,
      guid,
      attachmentGuid,
      snInsert,
      snSubmit,
    ]
  )

  //Validated Submission Handler
  const handleUiAction = useCallback(
    async (action: SnUiAction) => {
      await form.handleSubmit(async () => {
        await runUiActionRaw(action)
      }, onValidationError)()
    },
    [form, runUiActionRaw, onValidationError]
  )

  //Bind handler to gForm bridge
  useEffect(() => {
    setUiActionHandler(handleUiAction)
  }, [handleUiAction, setUiActionHandler])

  return {
    handleUiAction,
    loadingActionId,
    isBusy: !!loadingActionId,
    registerPreUiActionCallback,
    registerPostUiActionCallback,
    runUiActionRaw,
  }
}
