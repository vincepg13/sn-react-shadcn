export function parseAnswer(xml: string): string {
  try {
    if (typeof window !== 'undefined' && 'DOMParser' in window) {
      const doc = new DOMParser().parseFromString(xml, 'application/xml')

      if (!doc.getElementsByTagName('parsererror')?.[0]) {
        const root = doc.documentElement
        const attr = root.getAttribute('answer')
        if (attr != null) return attr

        const el = root.getElementsByTagName('answer')?.[0]
        if (el?.textContent) return el.textContent.trim()
      }
    }
  } catch {
    //Fallback to below
  }

  const attrMatch = xml.match(/<xml\b[^>]*\banswer="([^"]*)"/i)
  if (attrMatch) return decodeMinimalXmlEntities(attrMatch[1])

  const tagMatch = xml.match(/<answer(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/answer>/i)
  if (tagMatch) return decodeMinimalXmlEntities(tagMatch[1].trim())

  return ''
}

function decodeMinimalXmlEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export function parseAjaxGlideRecord(xml: string): Record<string, string> | null {
  try {
    if (typeof window !== 'undefined' && 'DOMParser' in window) {
      const doc = new DOMParser().parseFromString(xml, 'application/xml')
      if (doc.getElementsByTagName('parsererror')?.[0]) return null

      const item = doc.getElementsByTagName('item')?.[0] ?? doc.documentElement
      const out: Record<string, string> = {}

      if (item.hasAttribute('sys_id')) out.sys_id = item.getAttribute('sys_id') || ''

      Array.from(item.children).forEach((el: Element) => {
        out[el.tagName] = (el.textContent || '').trim()
      })

      return Object.keys(out).length ? out : null
    }
  } catch {
    // Fallback to below
  }

  const fields: Record<string, string> = {}
  const tagRe = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g
  const itemMatch = xml.match(/<item\b([^>]*)>([\s\S]*?)<\/item>/i)
  const block = itemMatch ? itemMatch[2] : xml
  const sysIdMatch = itemMatch?.[1]?.match(/\bsys_id="([^"]+)"/i)

  if (sysIdMatch) fields.sys_id = sysIdMatch[1]

  let m
  while ((m = tagRe.exec(block))) {
    fields[m[1]] = m[2].trim()
  }

  return Object.keys(fields).length ? fields : null
}
