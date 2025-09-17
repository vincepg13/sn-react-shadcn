import { useEffect, useState } from 'react'
import { Extension } from '@codemirror/state'
import { createInlineTern } from '../../../../lib/tern-inline'
import type { CompletionSource } from '@codemirror/autocomplete'

export function useInlineTern({
  serviceNowDefs,
  fileName = 'file.js',
}: {
  serviceNowDefs: unknown | null
  fileName?: string
}) {
  const [completionSource, setCompletionSource] = useState<CompletionSource>()
  const [signatureExt, setSignatureExt] = useState<Extension[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!serviceNowDefs) {
      setCompletionSource(undefined)
      setSignatureExt([])
      setReady(false)
      return
    }
    const { completionSource, signatureExt } = createInlineTern(serviceNowDefs, fileName)
    setCompletionSource(() => completionSource)
    setSignatureExt(signatureExt)
    setReady(true)
  }, [serviceNowDefs, fileName])

  return { completionSource, signatureExt, ready }
}
