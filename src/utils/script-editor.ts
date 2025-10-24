import { Prec, type Extension } from '@codemirror/state'
import { autocompletion } from '@codemirror/autocomplete'
import { getAxiosInstance } from '@kit/utils/axios-client'
import type { LanguageSupport } from '@codemirror/language'
import { atomone } from '@uiw/codemirror-theme-atomone'
import { copilot } from '@alisowski/codemirror-theme-copilot'
import { monokai } from '@alisowski/codemirror-theme-monokai'
import { dracula } from '@alisowski/codemirror-theme-dracula'
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode'
import { androidstudio } from '@alisowski/codemirror-theme-androidstudio'
import type { CompletionSource, CompletionResult } from '@codemirror/autocomplete'
import {
  ESLintConfigAny,
  ESLintV8LegacyConfig,
  ESLintV9FlatConfig,
  ESLintV9LanguageOptions,
  ESVersion,
} from '@kit/types/es-lint-types'
import { CmThemeValue } from '@kit/types/script-types'

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

export function mutateEsVersion(esVersion?: ESVersion, esLintConfig?: ESLintConfigAny) {
  if (esLintConfig && esVersion) {
    if ('languageOptions' in esLintConfig) {
      if (esLintConfig.languageOptions) {
        esLintConfig.languageOptions.ecmaVersion = esVersion
        if (esLintConfig.languageOptions.parserOptions)
          esLintConfig.languageOptions.parserOptions.ecmaVersion = esVersion
      }
    }
    if ('parserOptions' in esLintConfig) {
      if (esLintConfig.parserOptions) esLintConfig.parserOptions.ecmaVersion = esVersion
    }
  }
}

export function setEsVersion<T extends ESLintConfigAny>(esVersion: ESVersion, cfg: T): T | undefined {
  // Type guard: v9 flat config
  const isV9 = (c: ESLintConfigAny): c is ESLintV9FlatConfig => 'languageOptions' in c

  if (isV9(cfg)) {
    const lo: ESLintV9LanguageOptions = cfg.languageOptions ?? {}
    const nextLo: ESLintV9LanguageOptions = {
      ...lo,
      ecmaVersion: esVersion,
      parserOptions: {
        ...(lo.parserOptions ?? {}),
        ecmaVersion: esVersion,
      },
    }
    const out: typeof cfg = { ...cfg, languageOptions: nextLo }
    return out
  }

  // v8 legacy config
  const nextParserOptions: NonNullable<ESLintV8LegacyConfig['parserOptions']> = {
    ...(cfg.parserOptions ?? {}),
    ecmaVersion: esVersion,
  }
  const out: typeof cfg = { ...cfg, parserOptions: nextParserOptions }
  return out
}

export function getTheme(theme?: CmThemeValue) {
  switch (theme) {
    case 'light':
      return vscodeLight
    case 'dark':
      return vscodeDark
    case 'monokai':
      return monokai
    case 'dracula':
      return dracula
    case 'androidstudio':
      return androidstudio
    case 'copilot':
      return copilot
    default:
      return atomone
  }
}

export const boolColorByTheme: Record<CmThemeValue, string> = {
  light: '#098658',
  dark: '#B5CEA8',
  monokai: '#AE81FF',
  dracula: '#BD93F9',
  androidstudio: '#6897BB',
  copilot: '#79C0FF',
  atom: '#D19A66',
}
