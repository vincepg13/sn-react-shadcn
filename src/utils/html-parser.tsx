import DOMPurify from 'dompurify'
import parse, { domToReact, Element, DOMNode } from 'html-react-parser'

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
