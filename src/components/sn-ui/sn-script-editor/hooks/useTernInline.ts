// useTernInline.ts
import { useEffect, useState } from 'react'
import type { CompletionSource } from '@codemirror/autocomplete'
import { createInlineTern } from '../../../../lib/tern-inline'
import { Extension } from '@codemirror/state'

export function useInlineTern({
  serviceNowDefs,
  fileName = 'file.js',
}: {
  serviceNowDefs: unknown | null
  fileName?: string
}) {
  const [completionSources, setCompletionSources] = useState<CompletionSource[]>([])
  const [signatureExt, setSignatureExt] = useState<Extension[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!serviceNowDefs) {
      setCompletionSources([])
      setSignatureExt([])
      setReady(false)
      return
    }
    const { sources, signatureExt } = createInlineTern(serviceNowDefs, fileName)
    setCompletionSources(sources)
    setSignatureExt(signatureExt)
    setReady(true)
  }, [serviceNowDefs, fileName])

  return { completionSources, signatureExt, ready }
}