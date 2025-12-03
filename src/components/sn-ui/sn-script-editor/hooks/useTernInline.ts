import { useEffect, useState } from 'react'
import type { CompletionSource } from '@codemirror/autocomplete'
import { createInlineTern } from '../../../../lib/tern-inline'
import { Extension } from '@codemirror/state'

const EMPTY_DEFS: unknown[] = []

export function useInlineTern({
  serviceNowDefs,
  extraDefs,
  fileName = 'file.js',
}: {
  serviceNowDefs: unknown | null
  extraDefs?: unknown[]
  fileName?: string
}) {
  const [completionSources, setCompletionSources] = useState<CompletionSource[]>([])
  const [signatureExt, setSignatureExt] = useState<Extension[]>([])
  const [ready, setReady] = useState(false)

  const defsToUse = extraDefs ?? EMPTY_DEFS

  useEffect(() => {
    if (!serviceNowDefs && defsToUse.length === 0) {
      setCompletionSources([])
      setSignatureExt([])
      setReady(false)
      return
    }

    const { sources, signatureExt } = createInlineTern(serviceNowDefs, defsToUse, fileName)
    setCompletionSources(sources)
    setSignatureExt(signatureExt)
    setReady(true)
  }, [serviceNowDefs, defsToUse, fileName])

  return { completionSources, signatureExt, ready }
}
