import { useCallback, useEffect, useRef } from 'react'

/**
 * This hook provides an abortable controller that can be renewed or aborted.
 * It will automatically abort on component unmount and can be used to manage
 * a single AbortController instance for any asynchronous operation.
 */
export function useAbortableController() {
  const controllerRef = useRef<AbortController | null>(null)

  //Abort and reinitialise
  const renew = useCallback(() => {
    controllerRef.current?.abort()
    const c = new AbortController()
    controllerRef.current = c
    return c
  }, [])

  //Get current signal
  const getSignal = useCallback(() => renew().signal, [renew])

  //Abort current
  const abort = useCallback(() => controllerRef.current?.abort(), [])

  //Abort on unmount
  useEffect(() => abort, [abort])

  return { getSignal, renew, abort, controllerRef }
}

/**
 * a wrapper around useAbortableController to create a cancelable function. In this case
 * each wrapper controls its own AbortController instance.
 */
export function useCancelableFn<Args extends unknown[], R>(fn: (signal: AbortSignal, ...args: Args) => Promise<R>) {
  const { getSignal, abort } = useAbortableController()

  const run = useCallback(
    (...args: Args) => {
      const signal = getSignal()
      return fn(signal, ...args)
    },
    [fn, getSignal]
  )

  return { run, abort }
}
