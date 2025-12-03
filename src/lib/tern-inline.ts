/* eslint-disable @typescript-eslint/no-explicit-any */
import tern from 'tern'
import 'tern/plugin/doc_comment'
import ecma from 'tern/defs/ecmascript.json'

import type { CompletionSource } from '@codemirror/autocomplete'
import { snippet } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { EditorState, StateEffect, StateField } from '@codemirror/state'
import { EditorView, showTooltip, type Tooltip } from '@codemirror/view'

/* ----------------------------- helpers ---------------------------------- */
const IDENT_RE = /[A-Za-z0-9_$]+/

function toLineCh(doc: any, pos: number) {
  const line = doc.lineAt(pos)
  return { line: line.number - 1, ch: pos - line.from }
}

const FN_RE = /^fn\s*\((.*?)\)\s*(?:->\s*(.+))?$/ // tern style

function formatSignature(sig: string, activeIndex: number) {
  const m = sig.match(FN_RE)
  if (!m) return sig
  const [, argsStr = '', ret = ''] = m
  const args = argsStr ? argsStr.split(',').map(s => s.trim()) : []
  const parts = args.map((a, i) => (i === activeIndex ? `• ${a} •` : a))
  return `${parts.join(', ')}${ret ? ` → ${ret}` : ''}`
}

// names from SN defs we consider "globals/ctors"
function topLevelNamesFromDefs(defs: any): Set<string> {
  const s = new Set<string>()
  if (!defs || typeof defs !== 'object') return s
  for (const k of Object.keys(defs)) {
    if (k.startsWith('!')) continue
    s.add(k)
  }
  return s
}

/* ------------------------ signature tooltip ext -------------------------- */

const setSig = StateEffect.define<Tooltip | null>()

const sigField = StateField.define<Tooltip | null>({
  create: () => null,
  update(value, tr) {
    for (const e of tr.effects) if (e.is(setSig)) value = e.value
    if (tr.state.facet(EditorView.editable) === false) return null
    return value
  },
  provide: f => showTooltip.from(f),
})

function ternSignatureHelpExt(server: any, fileName: string) {
  // Helper: find end-of-callee position just before '(' of ArgList
  function calleeEndBeforeParen(doc: any, argListFrom: number) {
    let i = argListFrom - 1
    while (i >= 0 && /\s/.test(doc.sliceString(i, i + 1))) i--
    return Math.max(0, i + 1)
  }

  function isDirectlyInParenArgList(state: EditorState, pos: number, argList: any) {
    // Walk from the cursor up to ArgList; if we hit a nesting container first, bail.
    let node: any = syntaxTree(state).resolveInner(pos, -1)
    while (node && node !== argList) {
      if (
        node.name === 'ObjectExpression' ||
        node.name === 'ArrayExpression' ||
        node.name === 'ArrowFunction' ||
        node.name === 'FunctionExpression' ||
        node.name === 'TemplateString' ||
        node.name === 'Block'
      ) {
        return false
      }
      node = node.parent
    }
    return true
  }

  return [
    sigField,
    EditorView.updateListener.of(async update => {
      if (!update.selectionSet && !update.docChanged) return
      const view = update.view
      const state = view.state
      const pos = state.selection.main.head

      // detect ArgList
      const tree = syntaxTree(state)
      let node: any = tree.resolveInner(pos, -1)
      let argList: any = null
      while (node) {
        if (node.name === 'ArgList') {
          argList = node
          break
        }
        node = node.parent
      }
      if (!argList || !isDirectlyInParenArgList(state, pos, argList)) {
        view.dispatch({ effects: setSig.of(null) })
        return
      }

      const open = argList.from
      const between = state.doc.sliceString(open + 1, Math.max(open + 1, pos))
      const activeIndex = between.split(',').length - 1

      // sync file
      const text = state.doc.toString()
      try {
        server.delFile(fileName)
      } catch {
        /* empty */
      }
      server.addFile(fileName, text)

      // ask type at callee end (not inside args)
      const ternEnd = toLineCh(state.doc, calleeEndBeforeParen(state.doc, open))
      let resp: any
      await new Promise<void>(resolve => {
        server.request(
          {
            query: {
              type: 'type',
              file: fileName,
              end: ternEnd,
              lineCharPositions: true,
              preferFunction: true,
              guess: false,
            },
          },
          (_err: any, r: any) => {
            resp = r
            resolve()
          }
        )
      })

      const sig = resp?.type
      if (!sig || !sig.startsWith('fn(')) {
        view.dispatch({ effects: setSig.of(null) })
        return
      }

      const tooltip: Tooltip = {
        pos,
        above: true,
        strictSide: true,
        create() {
          const dom = document.createElement('div')
          dom.className = 'cm-signature px-2 py-1 text-xs rounded bg-black/80 text-white'
          dom.textContent = formatSignature(sig, activeIndex)
          return { dom }
        },
      }
      view.dispatch({ effects: setSig.of(tooltip) })
    }),
  ]
}

/* ----------------------------- main API --------------------------------- */

export function createInlineTern(
  serviceNowDefs: any,
  extraDefs: any[] = [],
  fileName = 'file.js'
): {
  sources: CompletionSource[]
  signatureExt: any[]
} {
  const allDefs = [ecma, ...extraDefs, serviceNowDefs].filter(Boolean)

  const server = new (tern as any).Server({
    async: false,
    defs: allDefs,
    plugins: { doc_comment: true },
  })

  const snGlobals = new Set<string>()
  for (const d of allDefs) {
    if (d === ecma) continue // optional, if you don’t want built-ins in your globalsSource
    for (const name of topLevelNamesFromDefs(d)) {
      snGlobals.add(name)
    }
  }

  function runTernCompletions(
    ctx: any,
    { filter = true, guess = true }: { filter?: boolean; guess?: boolean } = {}
  ): any[] {
    const text = ctx.state.doc.toString()
    try {
      server.delFile(fileName)
    } catch {
      /* empty */
    }
    server.addFile(fileName, text)

    let result: any = null
    server.request(
      {
        files: [],
        query: {
          type: 'completions',
          file: fileName,
          end: toLineCh(ctx.state.doc, ctx.pos),
          lineCharPositions: true,
          types: true,
          docs: false,
          includeKeywords: false,
          caseInsensitive: true,
          filter,
          guess,
        },
      },
      (_err: any, resp: any) => {
        result = resp
      }
    )
    return result?.completions || []
  }

  // 1) Members (methods/properties) after a dot.
  //    - Ask Tern for *all* members of the base expression (no prefix filter, no guess).
  //    - Then manually filter by the word before the cursor (case-insensitive).
  const memberSource: CompletionSource = (ctx: any) => {
    const word = ctx.matchBefore(IDENT_RE)
    const from = word ? word.from : ctx.pos
    const prefix = (word?.text ?? '').toLowerCase()

    const beforeIdx = (word ? from : ctx.pos) - 1
    const memberCtx = beforeIdx >= 0 && ctx.state.doc.sliceString(beforeIdx, beforeIdx + 1) === '.'
    if (!memberCtx) return null

    const raw = runTernCompletions(ctx, { filter: false, guess: false }).filter((c: any) => !c.guess)

    const filtered = prefix ? raw.filter((c: any) => c.name.toLowerCase().startsWith(prefix)) : raw

    const options = filtered.map((c: any) => {
      const isFn = typeof c.type === 'string' && c.type.startsWith('fn(')
      const isProp = !!c.isProperty
      return {
        label: c.name,
        type: isProp ? 'property' : isFn ? 'function' : 'variable',
        apply: isFn ? (snippet?.(`${c.name}(\${1})`) ?? `${c.name}()`) : c.name,
      }
    })

    if (!options.length) return null

    // We've already filtered by prefix; tell CM not to apply extra filtering.
    return { from, to: ctx.pos, options, filter: false }
  }

  // 2) TOP-LEVEL constructors/globals from SN defs only (no locals → no dupes)
  const globalsSource: CompletionSource = (ctx: any) => {
    const word = ctx.matchBefore(IDENT_RE)
    if (!word && !ctx.explicit) return null
    const from = word ? word.from : ctx.pos

    // Not in member context
    const beforeIdx = (word ? from : ctx.pos) - 1
    const memberCtx = beforeIdx >= 0 && ctx.state.doc.sliceString(beforeIdx, beforeIdx + 1) === '.'
    if (memberCtx) return null

    const opts = runTernCompletions(ctx, { filter: true, guess: true })
      .filter((c: any) => snGlobals.has(c.name))
      .map((c: any) => {
        const isFn = typeof c.type === 'string' && c.type.startsWith('fn(')
        return {
          label: c.name,
          type: isFn ? 'function' : 'variable',
          apply: isFn ? (snippet?.(`${c.name}(\${1})`) ?? `${c.name}()`) : c.name,
        }
      })

    if (!opts.length) return null
    return { from, to: ctx.pos, options: opts, filter: false }
  }

  const signatureExt = ternSignatureHelpExt(server, fileName)
  return { sources: [memberSource, globalsSource], signatureExt }
}

/** For backward-compat if need just one source */
export function createInlineTernCompletionSource(serviceNowDefs: any, extraDefs: any[] = [], fileName = 'file.js') {
  return createInlineTern(serviceNowDefs, extraDefs, fileName).sources[0]
}
