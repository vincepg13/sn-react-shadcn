import type { EditorState } from '@codemirror/state'
import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete'
import { snippet } from '@codemirror/autocomplete'

// ---------- Parse the SN schema ----------
type SNSchema = Record<string, any>

const FN_RE = /^fn\s*\((.*?)\)\s*(?:->\s*(.+))?$/ // "fn(a: string) -> +Type"
const ARG_RE = /\s*([^:,)]+)\s*:\s*([^,]+)\s*/g

function parseFn(sig?: string) {
  if (!sig) return { args: [] as { name: string; type: string }[], ret: undefined as string | undefined }
  const m = sig.match(FN_RE)
  if (!m) return { args: [], ret: undefined }
  const [, argsStr = '', ret] = m
  const args: { name: string; type: string }[] = []
  let am: RegExpExecArray | null
  while ((am = ARG_RE.exec(argsStr))) args.push({ name: am[1], type: am[2] })
  return { args, ret }
}

function normType(t?: string) {
  if (!t) return undefined
  // "+sn_ws.RESTResponseV2" | "+GlideElement" | "[string]" etc.
  let s = t.trim()
  // strip array brackets
  s = s.replace(/^\[+(.+?)\]+$/, '$1')
  // strip leading '+'
  s = s.replace(/^\+/, '')
  return s
}

function makeApply(name: string, kind: 'class'|'function'|'method', sig?: string) {
  const { args } = parseFn(sig)
  if (kind === 'class' || kind === 'function' || kind === 'method') {
    if (args.length) {
      const tpl = `${name}(${args.map((a, i) => `\${${i + 1}:${a.name}}`).join(', ')})`
      return snippet ? snippet(tpl) : tpl
    }
    return `${name}()`
  }
  return name
}

type Indexes = {
  GLOBAL_SYMBOLS: Completion[],                           // flat list of globals/classes/functions
  METHODS_BY_TYPE: Record<string, Completion[]>,          // type -> method completions
  RETURNS_BY_METHOD: Record<string, string | undefined>,  // "Type#method" -> ReturnType
  WELL_KNOWN_GLOBAL_TYPES: Record<string, string>,        // "$sp" -> "GlideSPScriptable"
}

function buildIndexes(schema: SNSchema): Indexes {
  const GLOBAL_SYMBOLS: Completion[] = []
  const METHODS_BY_TYPE: Record<string, Completion[]> = {}
  const RETURNS_BY_METHOD: Record<string, string | undefined> = {}
  const WELL_KNOWN_GLOBAL_TYPES: Record<string, string> = {
    $sp: 'GlideSPScriptable',
    gs: 'GlideSystem',
  }

  function ensure(arrMap: Record<string, Completion[]>, key: string) {
    if (!arrMap[key]) arrMap[key] = []
    return arrMap[key]
  }

  function pushGlobal(label: string, type: Completion['type'], path: string, doc?: string, sig?: string) {
    GLOBAL_SYMBOLS.push({
      label, type, detail: path + (sig ? ` — ${sig}` : ''), info: doc, apply: makeApply(label, type as any, sig),
    })
  }

  function pushMethod(owner: string, label: string, doc?: string, sig?: string) {
    ensure(METHODS_BY_TYPE, owner).push({
      label,
      type: 'method',
      detail: `${owner}#${label}` + (sig ? ` — ${sig}` : ''),
      info: doc,
      apply: makeApply(label, 'method', sig),
    })
    const { ret } = parseFn(sig)
    RETURNS_BY_METHOD[`${owner}#${label}`] = normType(ret)
  }

  function kindOf(node: any): 'class'|'function'|'object' {
    if (node?.prototype && typeof node['!type'] === 'string' && node['!type'].startsWith('fn')) return 'class'
    if (typeof node['!type'] === 'string' && node['!type'].startsWith('fn')) return 'function'
    return 'object'
  }

  function walk(name: string, node: any, path: string[] = []) {
    const fq = [...path, name].filter(Boolean).join('.')
    const doc = node['!doc'] as string | undefined
    const sig = node['!type'] as string | undefined
    const k = kindOf(node)

    if (!name.startsWith('!')) {
      if (k === 'class') pushGlobal(name, 'class', fq, doc, sig)
      else if (k === 'function') pushGlobal(name, 'function', fq, doc, sig)
      else if (doc || sig) pushGlobal(name, 'variable', fq, doc, sig)
    }

    // Methods
    if (node.prototype && typeof node.prototype === 'object') {
      for (const m of Object.keys(node.prototype)) {
        if (m.startsWith('!')) continue
        const meth = node.prototype[m]
        pushMethod(name, m, meth?.['!doc'], meth?.['!type'])
      }
    }

    // Children (namespaces)
    for (const key of Object.keys(node)) {
      if (key === 'prototype' || key.startsWith('!')) continue
      const child = node[key]
      if (child && typeof child === 'object') walk(key, child, [...path, name].filter(Boolean))
    }
  }

  for (const top of Object.keys(schema)) {
    if (top.startsWith('!')) continue
    walk(top, schema[top], [])
  }

  // de-dupe
  const dedupe = (arr: Completion[]) => {
    const seen = new Set<string>()
    return arr.filter(c => {
      const k = `${c.type}|${c.label}|${c.detail ?? ''}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

  for (const k of Object.keys(METHODS_BY_TYPE)) METHODS_BY_TYPE[k] = dedupe(METHODS_BY_TYPE[k])
  return { GLOBAL_SYMBOLS: dedupe(GLOBAL_SYMBOLS), METHODS_BY_TYPE, RETURNS_BY_METHOD, WELL_KNOWN_GLOBAL_TYPES }
}

// ---------- Quick & cheap type inference at the cursor ----------
function getReceiverInfo(state: EditorState, pos: number) {
  // Look back from cursor for "<ident>.<partial>" and capture the ident
  const upto = state.sliceDoc(0, pos)
  const m = upto.match(/([A-Za-z_$][\w$]*)\.\s*$/) || upto.match(/([A-Za-z_$][\w$]*)\.\w*$/)
  if (!m) return null
  const ident = m[1]

  // Search a small window above for "ident = new Type(" or "const ident = new Type("
  const start = Math.max(0, pos - 1200)
  const win = state.sliceDoc(start, pos)

  // new <Type>(
  const assignRx = new RegExp(
    `(?:const|let|var)?\\s*${ident}\\s*=\\s*new\\s+([A-Za-z_$][\\w$.]*)\\s*\\(`,
    'm'
  )
  const mAssign = win.match(assignRx)
  if (mAssign) return { ident, ctor: mAssign[1] }

  // Well-known simple: "$sp."
  if (ident === '$sp') return { ident, ctor: 'GlideSPScriptable' }
  if (ident === 'gs') return { ident, ctor: 'GlideSystem' }

  // Fallback: unknown
  return { ident, ctor: undefined }
}

// ---------- Completion source ----------
export function createServiceNowCompletionSource(schema: SNSchema): CompletionSource {
  const IDX = buildIndexes(schema)
  const GLOBALS = IDX.GLOBAL_SYMBOLS
  const BYTYPE = IDX.METHODS_BY_TYPE
  const WELLKNOWN = IDX.WELL_KNOWN_GLOBAL_TYPES

  function rootCompletions(prefix: string) {
    const p = prefix.toLowerCase()
    return GLOBALS.filter(c => c.label.toLowerCase().startsWith(p))
  }

  function memberCompletions(typeName: string | undefined, prefix: string) {
    if (!typeName) return []
    const short = typeName.split('.').pop()! // "sn_ws.RESTResponseV2" -> "RESTResponseV2"
    const methods = BYTYPE[typeName] || BYTYPE[short] || []
    const p = prefix.toLowerCase()
    return methods.filter(m => m.label.toLowerCase().startsWith(p))
  }

  return (ctx: CompletionContext): CompletionResult | null => {
    const word = ctx.matchBefore(/\w*/)
    if (!word) return null
    if (word.from === word.to && !ctx.explicit) return null

    const prefix = ctx.state.sliceDoc(word.from, ctx.pos)

    // Are we in "member" position? (just after a dot or typing a member)
    const chBefore = ctx.state.sliceDoc(Math.max(0, word.from - 1), word.from)
    const isMember = chBefore === '.'

    if (isMember) {
      const info = getReceiverInfo(ctx.state, word.from)
      const options = memberCompletions(info?.ctor, prefix)
      if (!options.length) return null
      return { from: word.from, to: ctx.pos, options, filter: false }
    }

    // Root/global (no dot): globals/classes/functions
    const options = rootCompletions(prefix)
    if (!options.length) return null
    return { from: word.from, to: ctx.pos, options, filter: false }
  }
}
