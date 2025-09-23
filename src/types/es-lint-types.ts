export type RuleLevel = 0 | 1 | 2 | 'off' | 'warn' | 'error'
export type RuleEntry = RuleLevel | [RuleLevel, ...unknown[]]

export type GlobalsMap =
  | Record<string, 'readonly' | 'writable' | boolean>
  | Record<string, 'off' | 'readonly' | 'writable'>

/* =========================================
 * ESLint v8 (legacy) config object
 * ======================================= */

export interface ESLintV8LegacyConfig {
  env?: Record<string, boolean>
  parser?: unknown
  parserOptions?: {
    ecmaVersion?: number | 'latest'
    sourceType?: 'script' | 'module'
    ecmaFeatures?: Record<string, boolean>
    [k: string]: unknown
  }
  globals?: GlobalsMap
  rules?: Record<string, RuleEntry>

  settings?: Record<string, unknown>
  plugins?: string[]
  overrides?: Array<ESLintV8LegacyConfig & { files?: string | string[]; excludedFiles?: string | string[] }>
  ignorePatterns?: string | string[]
}

/* =========================================
 * ESLint v9 (flat) config object
 * ======================================= */

export interface ESLintV9LanguageOptions {
  ecmaVersion?: number | 'latest'
  sourceType?: 'script' | 'module'
  globals?: GlobalsMap
  parser?: unknown
  parserOptions?: Record<string, unknown>
}

export interface ESLintV9FlatConfig {
  name?: string
  files?: string | string[]
  ignores?: string | string[]
  languageOptions?: ESLintV9LanguageOptions
  linterOptions?: {
    noInlineConfig?: boolean
    reportUnusedDisableDirectives?: boolean
    [k: string]: unknown
  }
  plugins?: Record<string, unknown>
  rules?: Record<string, RuleEntry>
  settings?: Record<string, unknown>
}

export type ESLintV9ConfigInput = ESLintV9FlatConfig | ESLintV9FlatConfig[]
export type ESLintConfigAny = ESLintV8LegacyConfig | ESLintV9FlatConfig
