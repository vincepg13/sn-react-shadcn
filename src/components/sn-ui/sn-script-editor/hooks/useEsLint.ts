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

/* ---------------- ESLint 8 default config (legacy shape) ---------------- */

export const esLintDefaultConfig: ESLintV8LegacyConfig = {
  env: { browser: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
  globals: { ...browser },
  rules: { semi: ['warn', 'always'], 'no-unused-vars': ['warn', { args: 'none' }] },
}

/* ----------------------- small deep merge for config -------------------- */

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
 * Normalize provided config(s) into a single ESLint 8 (legacy) config object.
 * Maps flat-config fields (languageOptions.*) to v8 shape and merges with defaults.
 */
function normalizeToV8Config(input: ESLintConfigAny | ESLintConfigAny[] | undefined): any {
  const configs = (Array.isArray(input) ? input : input ? [input] : []) as any[]

  const mapped = configs.map(cfg => {
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

  const mergedUser = mapped.reduce((acc, cfg) => deepMerge(acc, cfg), {} as any)
  const base = { ...esLintDefaultConfig }

  // Special case: ES5 requested
  const ecma = mergedUser?.parserOptions?.ecmaVersion
  if (ecma === 5) {
    base.parserOptions = { ecmaVersion: 5, sourceType: 'script' }
    base.env = { browser: true }
  }

  return deepMerge(base, mergedUser)
}

/* -------------------- ServiceNow wrapper + patching -------------------- */

type WrapResult = { code: string; insertLine: number | null; colDelta: number }

/**
 * If the file starts with an anonymous top-level function (ServiceNow-style),
 * prefix it with "void " so it's parsed as an expression statement.
 * No EOF changes -> same line count; only first-line columns shift by +5.
 */
function wrapForServiceNow(src: string): WrapResult {
  // Skip BOM + leading whitespace/comments
  const leadRe = /^(?:\uFEFF|\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*/
  const m = src.match(leadRe)
  const start = m ? m[0].length : 0

  const head = src.slice(start)
  const isAnonTopFn = /^(?:async\s+)?function\*?\s*\(/.test(head)

  if (!isAnonTopFn) return { code: src, insertLine: null, colDelta: 0 }

  // 1-based line number where we insert "void "
  const insertLine = src.slice(0, start).split('\n').length
  const wrapped = src.slice(0, start) + 'void ' + src.slice(start)

  return { code: wrapped, insertLine, colDelta: 5 } // "void " length
}

function adjustMessagePos<T>(
  msg: T & { line?: number; column?: number; endLine?: number; endColumn?: number },
  insertLine: number | null,
  colDelta: number
) {
  if (insertLine == null || !colDelta) return msg
  const clone: any = { ...msg }

  if (clone.line === insertLine && typeof clone.column === 'number') {
    clone.column = Math.max(1, clone.column - colDelta)
  }
  if (clone.endLine === insertLine && typeof clone.endColumn === 'number') {
    clone.endColumn = Math.max(1, clone.endColumn - colDelta)
  }
  return clone as T
}

/** Filter out ONLY the bogus semicolon warning produced by the wrapper. */
function isWrapperSemiFalsePositive(msg: any, lastLine: number, insertLine: number | null, colDelta: number) {
  if (!insertLine || !colDelta) return false
  if (msg?.ruleId !== 'semi') return false
  const text = String(msg?.message || '').toLowerCase()
  if (!text.includes('missing semicolon')) return false
  // Points to the end of the last line of the (unwrapped) file
  return msg.line === lastLine || msg.endLine === lastLine
}

function patchLinterForServiceNow(linter: any) {
  const origVerify = linter.verify?.bind(linter)
  const origVerifyAndFix = linter.verifyAndFix?.bind(linter)

  if (origVerify) {
    linter.verify = (code: string, config: any, filename?: string) => {
      const { code: wrapped, insertLine, colDelta } = wrapForServiceNow(code)
      const lastLine = code.split('\n').length
      const out = origVerify(wrapped, config, filename) || []
      const mapped = out.map((m: any) => adjustMessagePos(m, insertLine, colDelta))
      return mapped.filter((m: any) => !isWrapperSemiFalsePositive(m, lastLine, insertLine, colDelta))
    }
  }

  if (origVerifyAndFix) {
    linter.verifyAndFix = (code: string, config: any, options?: any) => {
      const { code: wrapped, insertLine, colDelta } = wrapForServiceNow(code)
      const lastLine = code.split('\n').length
      const res = origVerifyAndFix(wrapped, config, options)
      res.messages = (res.messages || [])
        .map((m: any) => adjustMessagePos(m, insertLine, colDelta))
        .filter((m: any) => !isWrapperSemiFalsePositive(m, lastLine, insertLine, colDelta))
      res.output = code // keep original text
      return res
    }
  }
}

/* ------------------------------- Hook ---------------------------------- */

export function useEsLint(opts: UseEsLintOptions = { enabled: false }): {
  extensions: Extension[]
  ready: boolean
  error: string | null
} {
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

        const l = new LinterCtor()
        patchLinterForServiceNow(l) // enable ServiceNow anonymous top-level function support

        const lintSource = cmEsLint(l, v8ConfigObject)

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
