// /hooks/useTernCompletion.ts
import { useEffect, useMemo, useRef, useState } from 'react'
import { createTernCompletionSource } from '../../../../lib/ternCm6Bridge'

type UseTernOpts = {
  serviceNowDefs: any | null // SN JSON you fetch from your API
  fileName?: string
  extraDefsUrls?: string[] // e.g. ['/tern/browser.json'] if you want DOM globals
}

// cache across hook instances so we only fetch once
let ecma5DefsPromise: Promise<any> | null = null
const loadEcma5 = () => {
  if (!ecma5DefsPromise) {
    ecma5DefsPromise = fetch('/tern/ecma5.json').then(r => {
      if (!r.ok) throw new Error(`Failed to load /tern/ecma5.json (${r.status})`)
      return r.json()
    })
  }
  return ecma5DefsPromise
}

async function loadExtra(urls: string[] = []) {
  const out: any[] = []
  for (const url of urls) {
    const r = await fetch(url)
    if (!r.ok) throw new Error(`Failed to load ${url} (${r.status})`)
    out.push(await r.json())
  }
  return out
}

export function useTernCompletion({ serviceNowDefs, extraDefsUrls = [], fileName = 'file.js' }: UseTernOpts) {
  const workerRef = useRef<Worker | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!serviceNowDefs) return
    ;(async () => {
      try {
        const [ecma5Defs, extraDefs] = await Promise.all([
          loadEcma5(), // from /public/tern/ecma5.json
          loadExtra(extraDefsUrls), // optional extras, also from /public
        ])
        if (cancelled) return

        const worker = new Worker(new URL('../workers/tern-worker.ts', import.meta.url), { type: 'module' })
        // const worker = new Worker(
        //   new URL('../workers/tern-worker-classic.js', import.meta.url),
        //   { type: 'classic' } // IMPORTANT: classic, not module
        // )

        worker.addEventListener('error', e => {
          console.error('[tern worker] error', e)
          setError(e.message || 'Worker error')
        })
        worker.addEventListener('messageerror', e => {
          console.error('[tern worker] messageerror', e)
        })

        const onMsg = (e: MessageEvent) => {
          if (e.data?.type === 'boot-ok') {
            console.log('[tern] boot-ok (libs loaded)')
          }
          if (e.data?.type === 'boot-error') {
            console.error('[tern] boot-error:', e.data.error)
            setError(e.data.error)
          }
          if (e.data?.type === 'inited') {
            console.log('[tern] inited')
            setReady(true)
          }
          if (e.data?.type === 'error') {
            console.error('[tern] error:', e.data.error)
            setError(e.data.error || 'Tern init error')
          }
        }
        worker.addEventListener('message', onMsg)

        workerRef.current = worker

        worker.postMessage({
          type: 'init',
          defs: [ecma5Defs, ...extraDefs, serviceNowDefs],
          plugins: { doc_comment: true },
        })

        // cleanup
        return () => {
          worker.removeEventListener('message', onMsg)
          worker.terminate()
          workerRef.current = null
        }
      } catch (e: any) {
        if (!cancelled) setError(String(e?.message || e))
      }
    })()

    return () => {
      cancelled = true
      setReady(false)
    }
  }, [serviceNowDefs, extraDefsUrls])

  const completionSource = useMemo(() => {
    if (!ready || !workerRef.current) return undefined
    return createTernCompletionSource(workerRef.current, fileName)
  }, [ready, fileName])

  return { completionSource, ready, error }
}
