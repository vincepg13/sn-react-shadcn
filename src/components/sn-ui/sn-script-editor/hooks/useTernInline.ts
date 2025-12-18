import { useEffect, useState } from 'react'
import { Extension } from '@codemirror/state'
import { InlineTernConfig } from '@kit/types/script-types'
import { createInlineTern } from '../../../../lib/tern-inline'
import type { CompletionSource } from '@codemirror/autocomplete'

const EMPTY_DEFS: unknown[] = []

export function useInlineTern({
  serviceNowDefs,
  extraDefs,
  fileName = 'file.js',
  config,
}: {
  serviceNowDefs: unknown | null
  extraDefs?: unknown[]
  fileName?: string
  config?: InlineTernConfig
}) {
  const [completionSources, setCompletionSources] = useState<CompletionSource[]>([])
  const [signatureExt, setSignatureExt] = useState<Extension[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const defsToUse = extraDefs ?? EMPTY_DEFS

    if (!serviceNowDefs && defsToUse.length === 0) {
      setCompletionSources([])
      setSignatureExt([])
      setReady(false)
      return
    }

    const { sources, signatureExt } = createInlineTern(
      serviceNowDefs,
      defsToUse,
      fileName,
      config ?? {}
    )

    setCompletionSources(sources)
    setSignatureExt(signatureExt)
    setReady(true)
  }, [serviceNowDefs, extraDefs, fileName, config])

  return { completionSources, signatureExt, ready }
}