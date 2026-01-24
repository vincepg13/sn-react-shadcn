/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useCallback } from 'react'

export type DebouncedFn<T extends (...args: any[]) => void> = {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function useDebouncedFn<T extends (...args: any[]) => void>(fn: T, delay: number): DebouncedFn<T> {
  const fnRef = useRef(fn)
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => void (fnRef.current = fn), [fn])

  const cancel = useCallback(() => {
    if (tRef.current) clearTimeout(tRef.current)
    tRef.current = null
  }, [])

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (tRef.current) clearTimeout(tRef.current)
      tRef.current = setTimeout(() => fnRef.current(...args), delay)
    },
    [delay]
  )

  useEffect(() => () => cancel(), [cancel])

  return Object.assign(debounced, { cancel })
}
