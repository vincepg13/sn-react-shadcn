import DOMPurify from 'dompurify'
import { EditorView } from '@codemirror/view'
import parse, { domToReact, Element, DOMNode } from 'html-react-parser'

export const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

export function htmlToReact(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a','b','i','strong','em','code','br','span'],
    ALLOWED_ATTR: ['href','target','rel'],
  })

  return parse(clean, {
    replace: (node) => {
      if (node.type === 'tag') {
        const el = node as Element

        // Force safe anchors
        if (el.name === 'a') {
          const { href = '#', target } = el.attribs || {}
          return (
            <a
              href={href}
              target={target || '_blank'}
              rel="noopener noreferrer"
              className="underline"
            >
              {domToReact(el.children as DOMNode[])}
            </a>
          )
        }

        // Strip unknown inline styles/classes, images, etc.
        if (el.name === 'img') return null
      }
      return undefined
    },
  })
}

export const forceCloseSameTag = EditorView.inputHandler.of((view, _from, to, text) => {
  if (text !== '>') return false

  const pos = view.state.selection.main.head
  const before = view.state.doc.sliceString(Math.max(0, pos - 200), pos)

  const m = before.match(/<([a-zA-Z][\w:-]*)[^<>]*$/)
  if (!m) return false

  const rawTag = m[1] 
  const tagName = rawTag.toLowerCase().split(':').pop() ?? rawTag.toLowerCase()

  // If this is a void element, don't auto-insert a closing tag
  if (VOID_ELEMENTS.has(tagName)) return false    

  // For normal elements, insert `></tag>` and put caret between them
  view.dispatch({
    changes: { from: pos, to, insert: `></${rawTag}>` },
    selection: { anchor: pos + 1 },
    userEvent: 'input',
  })

  return true
})