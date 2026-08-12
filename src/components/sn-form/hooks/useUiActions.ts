/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldErrors, UseFormReturn } from 'react-hook-form'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildSubmissionPayload, triggerNativeUIAction } from '@kit/utils/form-client'
import {
  SnFieldPrimitive,
  SnFormValues,
  SnUiAction,
  SnFieldsSchema,
  SnUiResponse,
  UiActionHandler,
} from '@kit/types/form-schema'
import type {
  BeforeUiActionSubmitCallback,
  SnGForm,
  UiActionClientCallback,
  UiActionController,
} from '@kit/types/g-form'
import { toast } from 'sonner'
import { htmlToReact } from '@kit/utils/html-parser'
import { errorHandler } from '@kit/lib/utils'
import { createUiActionClientGForm } from '@kit/lib/g-form'
import { toSafe } from './useDotSafeForm'

type Callback = () => void | Promise<void>

type UseUiActionsParams<TFormValues extends Record<string, any> = Record<string, any>> = {
  table: string
  guid: string
  attachmentGuid: string
  uiActions: SnUiAction[]
  formFields: SnFieldsSchema
  form: UseFormReturn<TFormValues>
  gForm: SnGForm
  snSubmit: (guid: string) => void
  onValidationError: (errors: FieldErrors) => void
  runOnSubmitClientScripts: (action: string) => boolean
  waitForFieldUIUpdates: () => Promise<void>
  setUiActionHandler: (fn?: UiActionHandler) => void
  uiActionClientCallback?: UiActionClientCallback
  beforeUiActionSubmitCallback?: BeforeUiActionSubmitCallback
  snInsert?: (guid: string) => void
}

export function useUiActions<TFormValues extends Record<string, any> = Record<string, any>>(
  params: UseUiActionsParams<TFormValues>
) {
  const {
    form,
    gForm,
    onValidationError,
    formFields,
    uiActions,
    table,
    guid,
    attachmentGuid,
    runOnSubmitClientScripts,
    waitForFieldUIUpdates,
    snSubmit,
    snInsert,
    setUiActionHandler,
    uiActionClientCallback,
    beforeUiActionSubmitCallback,
  } = params

  //lifecycle callback registries
  const preCallbacks = useRef<Map<string, Callback>>(new Map())
  const postCallbacks = useRef<Map<string, Callback>>(new Map())
  const uiActionClientGForm = useMemo(() => createUiActionClientGForm(gForm), [gForm])

  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({})
  const [disabledOverrides, setDisabledOverrides] = useState<Record<string, boolean>>({})
  const uiActionsRef = useRef(uiActions)
  uiActionsRef.current = uiActions

  //loading state (prevent spam submissions)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)
  const loadingActionIdRef = useRef<string | null>(null)

  const uiActionController = useMemo<UiActionController>(() => {
    const showOnly = (actionName: string) => {
      setVisibilityOverrides(
        Object.fromEntries(uiActionsRef.current.map(action => [action.action_name, action.action_name === actionName]))
      )
    }

    const setVisible = (actionName: string, visible: boolean) => {
      setVisibilityOverrides(current => ({ ...current, [actionName]: visible }))
    }

    const setDisabled = (actionName: string, disabled: boolean) => {
      setDisabledOverrides(current => ({ ...current, [actionName]: disabled }))
    }

    const reset = () => {
      setVisibilityOverrides({})
      setDisabledOverrides({})
    }

    return { showOnly, setVisible, setDisabled, reset }
  }, [])

  const visibleUiActions = useMemo(
    () => uiActions.filter(action => visibilityOverrides[action.action_name] !== false),
    [uiActions, visibilityOverrides]
  )

  const isActionDisabled = useCallback(
    (actionName: string) => !!loadingActionId || disabledOverrides[actionName] === true,
    [disabledOverrides, loadingActionId]
  )

  const uiActionIdentity = useMemo(
    () => uiActions.map(action => `${action.sys_id}:${action.action_name}`).join('\u0000'),
    [uiActions]
  )

  useEffect(() => {
    uiActionController.reset()
  }, [table, guid, formFields, uiActionIdentity, uiActionController])

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

  const validateForm = useCallback(async () => {
    let isValid = false

    await form.handleSubmit(
      () => {
        isValid = true
      },
      errors => onValidationError(errors)
    )()

    return isValid
  }, [form, onValidationError])

  const getValuesSnapshot = useCallback(() => {
    const internalValues = form.getValues() as Record<string, SnFieldPrimitive | null | undefined>
    return Object.freeze(
      Object.fromEntries(
        Object.values(formFields).map(field => {
          const value = internalValues[toSafe(field.name)]
          return [field.name, Array.isArray(value) ? Object.freeze([...value]) : value]
        })
      )
    ) as SnFormValues
  }, [form, formFields])

  // UI Action guard, validation, and submission pipeline
  const runUiActionRaw = useCallback(
    async (action: SnUiAction) => {
      if (loadingActionIdRef.current || isActionDisabled(action.action_name)) return
      loadingActionIdRef.current = action.sys_id
      setLoadingActionId(action.sys_id)
      try {
        if (uiActionClientCallback) {
          try {
            const isAllowed = await uiActionClientCallback(action, {
              values: getValuesSnapshot(),
              gForm: uiActionClientGForm,
              uiActions: uiActionController,
            })
            if (!isAllowed) return
          } catch (error) {
            errorHandler(error, 'Failed to run UI action client callback')
            return
          }
        }

        if (action.action_name !== 'sysverb_delete') {
          await waitForFieldUIUpdates()
          const isValid = await validateForm()
          if (!isValid) return
        }

        if (beforeUiActionSubmitCallback) {
          try {
            const isAllowed = await beforeUiActionSubmitCallback(action, {
              values: getValuesSnapshot(),
              gForm: uiActionClientGForm,
              uiActions: uiActionController,
            })
            if (!isAllowed) return
          } catch (error) {
            errorHandler(error, 'Failed to run before UI action submit callback')
            return
          }
        }

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
        //console.log('UI Action Response:', uiRes)

        if (uiRes.$$uiNotification) {
          uiRes.$$uiNotification.forEach(msg => {
            if (msg.type === 'error') toast.error(htmlToReact(msg.message))
            else if (msg.type === 'success') toast.success(htmlToReact(msg.message))
            else if (msg.type === 'info') toast.info(htmlToReact(msg.message))
            else toast(htmlToReact(msg.message))
          })
        }

        if (uiRes?.isActionAborted) return

        if (snInsert && uiRes?.isInsert) return snInsert(uiRes.sys_id)
        snSubmit(guid)
      } finally {
        loadingActionIdRef.current = null
        setLoadingActionId(null)
      }
    },
    [
      runOnSubmitClientScripts,
      runCallbacks,
      form,
      formFields,
      table,
      guid,
      attachmentGuid,
      uiActionClientCallback,
      beforeUiActionSubmitCallback,
      uiActionClientGForm,
      uiActionController,
      getValuesSnapshot,
      waitForFieldUIUpdates,
      validateForm,
      snInsert,
      snSubmit,
      isActionDisabled,
    ]
  )

  // Shared entry point for buttons and g_form save/submit calls
  const handleUiAction = useCallback(
    async (action: SnUiAction) => {
      await runUiActionRaw(action)
    },
    [runUiActionRaw]
  )

  //Bind handler to gForm bridge
  useEffect(() => {
    setUiActionHandler(handleUiAction)
  }, [handleUiAction, setUiActionHandler])

  return {
    handleUiAction,
    loadingActionId,
    visibleUiActions,
    uiActionController,
    isActionDisabled,
    isBusy: !!loadingActionId,
    registerPreUiActionCallback,
    registerPostUiActionCallback,
    runUiActionRaw,
  }
}
