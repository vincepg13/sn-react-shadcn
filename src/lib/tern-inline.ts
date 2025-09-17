/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GPT Generated for tern server because I really couldnt be asked to figure it out myself
 */
import tern from 'tern'
import 'tern/plugin/doc_comment'
import ecma from 'tern/defs/ecmascript.json'

import type { CompletionSource } from '@codemirror/autocomplete'
import { snippet } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { StateEffect, StateField } from '@codemirror/state'
import { EditorView, showTooltip, type Tooltip } from '@codemirror/view'

/* ----------------------------- helpers ---------------------------------- */

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
  // Helper: find the position of the char just before '(' that opened this ArgList
  function calleeEndBeforeParen(doc: any, argListFrom: number) {
    // `argListFrom` is at '('
    let i = argListFrom - 1
    // Skip spaces/newlines before '('
    while (i >= 0) {
      const ch = doc.sliceString(i, i + 1)
      if (/\s/.test(ch)) i--
      else break
    }
    // Now i is last non-space before '(' (end of callee: e.g. 'gr.addQuery')
    return Math.max(0, i + 1) // Tern wants the "end" position (1-past-last)
  }

  return [
    sigField,
    EditorView.updateListener.of(async (update) => {
      if (!update.selectionSet && !update.docChanged) return

      const view = update.view
      const state = view.state
      const pos = state.selection.main.head

      // Are we inside an argument list?
      const tree = syntaxTree(state)
      let node: any = tree.resolveInner(pos, -1)
      let argList: any = null
      while (node) {
        if (node.name === 'ArgList') { argList = node; break }
        node = node.parent
      }
      if (!argList) {
        view.dispatch({ effects: setSig.of(null) })
        return
      }

      // Active param index = commas since '(' up to the cursor
      const open = argList.from // should be at '('
      const between = state.doc.sliceString(open + 1, Math.max(open + 1, pos))
      const activeIndex = between.split(',').length - 1

      // Ask Tern for the callee’s type (cursor at end of callee, not inside args)
      const ternEndPosChar = calleeEndBeforeParen(state.doc, open)
      const ternEnd = toLineCh(state.doc, ternEndPosChar)

      // Sync file
      const text = state.doc.toString()
      try { server.delFile(fileName) } catch { /* empty */ }
      server.addFile(fileName, text)

      // Prefer function type
      let resp: any
      await new Promise<void>((resolve) => {
        server.request(
          {
            query: {
              type: 'type',
              file: fileName,
              end: ternEnd,
              lineCharPositions: true,
              preferFunction: true,
            },
          },
          (_err: any, r: any) => { resp = r; resolve() }
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

/**
 * Builds an inline Tern server once and returns:
 *  - completionSource: minimal list (names only), but still Tern-powered
 *  - signatureExt: CM6 extension showing a tooltip when inside call parens
 */
export function createInlineTern(serviceNowDefs: any, fileName = 'file.js'): {
  completionSource: CompletionSource,
  signatureExt: any[]
} {
  const server = new (tern as any).Server({
    async: false,
    defs: [ecma, serviceNowDefs].filter(Boolean),
    plugins: { doc_comment: true },
  })

  const completionSource: CompletionSource = (ctx: any) => {
    // If there’s a word use it; if not (e.g. right after '.'), still run Tern
    const word = ctx.matchBefore(/\w+/)
    const from = word ? word.from : ctx.pos

    // Don’t pop on empty unless explicit or after '.'
    const prev = ctx.pos > 0 ? ctx.state.doc.sliceString(ctx.pos - 1, ctx.pos) : ''
    if (!ctx.explicit && !word && prev !== '.') return null

    const text = ctx.state.doc.toString()
    try { server.delFile(fileName) } catch { /* empty */ }
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
          filter: true,
          guess: true,
        },
      },
      (_err: any, resp: any) => { result = resp }
    )

    const options = (result?.completions || []).map((c: any) => {
      const isFn = typeof c.type === 'string' && c.type.startsWith('fn(')
      return {
        label: c.name,
        type: c.isProperty ? 'property' : (isFn ? 'function' : 'variable'),
        // minimal list: insert fnName(${1}) or just name
        apply: isFn ? (snippet?.(`${c.name}(\${1})`) ?? `${c.name}()`) : c.name,
      }
    })

    if (!options.length) return null
    return { from, to: ctx.pos, options, filter: false }
  }

  const signatureExt = ternSignatureHelpExt(server, fileName)
  return { completionSource, signatureExt }
}

/**
 * Backwards-compat: only the completion source (no signature help).
 * (Matches your previous function name.)
 */
export function createInlineTernCompletionSource(serviceNowDefs: any, fileName = 'file.js') {
  return createInlineTern(serviceNowDefs, fileName).completionSource
}
