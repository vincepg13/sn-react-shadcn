import { getAxiosInstance } from '@kit/utils/axios-client'
import type { CompletionSource, CompletionResult } from '@codemirror/autocomplete'
import { autocompletion } from '@codemirror/autocomplete'
import { Prec, type Extension } from '@codemirror/state'
import type { LanguageSupport } from '@codemirror/language'

export async function getAutocompleteData(table: string, field: string, controller: AbortController | AbortSignal) {
  const res = await getAxiosInstance().get(`/api/now/sp/editor/autocomplete/table/${table}/field/${field}`, {
    signal: controller instanceof AbortController ? controller.signal : controller,
  })
  return res.data.result
}

// De-duplicate completion results (by label, type, detail).
function dedupe(result: CompletionResult | null): CompletionResult | null {
  if (!result || !result.options?.length) return result
  const seen = new Set<string>()
  const options = []
  for (const o of result.options) {
    const key = `${o.label}|${o.type ?? ''}|${o.detail ?? ''}`
    if (!seen.has(key)) {
      seen.add(key)
      options.push(o)
    }
  }
  return { ...result, options }
}

// Wrap a completion source to de-duplicate its results.
const wrapSource =
  (src: CompletionSource): CompletionSource =>
  ctx => {
    const r = src(ctx)
    return r instanceof Promise ? r.then(dedupe) : dedupe(r)
  }

// Merge many results into one (keeps all items, adjusts from/to).
function mergeResults(results: (CompletionResult | null)[], pos: number): CompletionResult | null {
  const nonNull = results.filter(Boolean) as CompletionResult[]
  if (!nonNull.length) return null
  const from = Math.min(...nonNull.map(r => r.from ?? pos))
  const to = Math.max(...nonNull.map(r => r.to ?? pos))
  const options = nonNull.flatMap(r => r.options ?? [])
  return dedupe({ from, to, options, filter: false })
}

// Merge many sources into one (keeps earlier sources’ items if duplicates).
function mergeSources(sources: CompletionSource[]): CompletionSource {
  const wrapped = sources.map(wrapSource) // each is independently deduped
  return ctx => {
    const outs = wrapped.map(s => s(ctx))
    if (outs.some(o => o instanceof Promise)) {
      return Promise.all(outs.map(o => (o instanceof Promise ? o : Promise.resolve(o)))).then(rs =>
        mergeResults(rs, ctx.pos)
      )
    }
    return mergeResults(outs as (CompletionResult | null)[], ctx.pos)
  }
}

// Build comdemirror autocompletion extension from one or more sources.
export function buildAutocomplete(
  lang: LanguageSupport,
  sources: CompletionSource[] | undefined,
  mode: 'default' | 'override' = 'default'
): Extension | Extension[] {
  if (!sources?.length) return autocompletion({ activateOnTyping: true })

  const merged = mergeSources(sources)
  if (mode === 'override') return autocompletion({ activateOnTyping: true, override: [merged] })

  return [autocompletion({ activateOnTyping: true }), Prec.high(lang.language.data.of({ autocomplete: merged }))]
}
