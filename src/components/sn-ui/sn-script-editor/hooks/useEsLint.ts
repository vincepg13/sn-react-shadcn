/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Extension } from '@codemirror/state'
import { useEffect, useMemo, useState } from 'react'
import { esLint as cmEsLint } from '@codemirror/lang-javascript'
import { linter, lintGutter } from '@codemirror/lint'
import { browser } from 'globals'
import { ESLintConfigAny, ESLintV8LegacyConfig } from '@kit/types/es-lint-types'

type UseEsLintOptions = {
  enabled: boolean
  config?: ESLintConfigAny | ESLintConfigAny[]
  debounceMs?: number | null
  showGutter?: boolean
}

// --- ESLint 8 default config (legacy shape) ---
export const esLintDefaultConfig: ESLintV8LegacyConfig = {
  env: { browser: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
  globals: { ...browser },
  rules: { semi: ['warn', 'always'], 'no-unused-vars': ['warn', { args: 'none' }] },
}

// shallow-ish deep merge good enough for config objects
function deepMerge<T>(a: T, b: Partial<T>): T {
  if (!b) return a
  const out: any = Array.isArray(a) ? [...(a as any)] : { ...(a as any) }
  for (const k of Object.keys(b as any)) {
    const v: any = (b as any)[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge((a as any)[k] ?? {}, v)
    } else {
      out[k] = v
    }
  }
  return out
}

/**
 * Normalize any provided config(s) into a single ESLint 8 (legacy) config object.
 * - Maps flat-config fields (languageOptions.globals/parserOptions, sourceType/ecmaVersion) to v8 shape.
 * - Collapses arrays into one merged object.
 */
function normalizeToV8Config(input: ESLintConfigAny | ESLintConfigAny[] | undefined): any {
  const configs = (Array.isArray(input) ? input : input ? [input] : []) as any[]

  const mapped = configs.map((cfg) => {
    if (!cfg || typeof cfg !== 'object') return {}
    const c = { ...cfg }

    // Map flat-config -> v8 legacy
    if (c.languageOptions) {
      const lo = c.languageOptions
      if (lo.parserOptions && typeof lo.parserOptions === 'object') {
        c.parserOptions = { ...(c.parserOptions || {}), ...lo.parserOptions }
      }
      if (lo.ecmaVersion && !c.parserOptions?.ecmaVersion) {
        c.parserOptions = { ...(c.parserOptions || {}), ecmaVersion: lo.ecmaVersion }
      }
      if (lo.sourceType && !c.parserOptions?.sourceType) {
        c.parserOptions = { ...(c.parserOptions || {}), sourceType: lo.sourceType }
      }
      if (lo.globals && typeof lo.globals === 'object') {
        c.globals = { ...(c.globals || {}), ...lo.globals }
      }
      if (lo.parser && !c.parser) c.parser = lo.parser

      delete c.languageOptions
    }

    if (!c.env) c.env = {}
    if (!c.parserOptions) c.parserOptions = {}
    if (!c.rules) c.rules = {}
    if (!c.globals) c.globals = {}

    return c
  })

  // Merge all provided configs into defaults (first), then user overrides
  const mergedUser = mapped.reduce((acc, cfg) => deepMerge(acc, cfg), {} as any)
  const base = { ...esLintDefaultConfig }

  // Special case: if user explicitly requests ES5, adapt parserOptions/env
  const ecma = mergedUser?.parserOptions?.ecmaVersion
  if (ecma === 5) {
    base.parserOptions = { ecmaVersion: 5, sourceType: 'script' }
    base.env = { browser: true }
  }

  return deepMerge(base, mergedUser)
}

export function useEsLint(
  opts: UseEsLintOptions = { enabled: false }
): { extensions: Extension[]; ready: boolean; error: string | null } {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extensions, setExtensions] = useState<Extension[]>([])
  const { enabled, config, debounceMs = 300, showGutter = true } = opts

  const v8ConfigObject = useMemo(() => normalizeToV8Config(config), [config])

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setError(null)
    setExtensions([])

    if (!enabled) return

    ;(async () => {
      try {
        const mod = await import('eslint-linter-browserify')
        const LinterCtor = (mod as any).Linter
        if (!LinterCtor) throw new Error('Failed to load ESLint Linter')

        const lintSource = cmEsLint(new LinterCtor(), v8ConfigObject)

        const exts: Extension[] = [linter(lintSource, { delay: Math.max(0, debounceMs ?? 0) })]
        if (showGutter) exts.unshift(lintGutter())

        if (!cancelled) {
          setExtensions(exts)
          setReady(true)
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(String(e?.message || e))
          setExtensions([])
          setReady(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, v8ConfigObject, debounceMs, showGutter])

  return { extensions, ready, error }
}