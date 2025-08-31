import { getAxiosInstance, getGlideAjaxConfig } from '../utils/axios-client'

const DEFAULTS = {
  endpoint: '/xmlhttp.do',
  debug: false,
  defaults: {
    sysparm_want_session_messages: 'true',
    'ni.nolog.x_referer': 'ignore',
  },
}

function parseAnswer(xml: string): string {
  const attrMatch = xml.match(/<xml\b[^>]*\banswer="([^"]*)"/i)
  if (attrMatch) return attrMatch[1]

  const tagMatch = xml.match(/<answer(?:\s[^>]*)?>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/answer>/i)
  if (tagMatch) return tagMatch[1].trim()

  return ''
}

export class GlideAjax {
  private processor: string
  private params: Record<string, string> = {}

  constructor(processor: string) {
    if (!processor) throw new Error('GlideAjax requires a Script Include name')
    this.processor = processor
  }

  addParam(name: string, value: string) {
    this.params[name] = value || ''
  }

  async getXMLAnswer(cb?: (answer: string) => void): Promise<string> {
    const xml = await this.getXML()
    const { extractAnswer } = getGlideAjaxConfig()
    const answer = (extractAnswer ?? parseAnswer)(xml)
    if (cb) cb(answer)
    return answer
  }

  async getXML(cb?: (xml: string) => void): Promise<string> {
    const axios = getAxiosInstance()
    const cfg = { ...DEFAULTS, ...getGlideAjaxConfig() }

    const url = `${cfg.endpoint}?sysparm_processor=${encodeURIComponent(this.processor)}`
    const body = new URLSearchParams({ ...DEFAULTS.defaults, ...(cfg.defaults ?? {}), ...this.params })

    try {
      if (cfg.debug) console.log('[GlideAjax] POST', url, Object.fromEntries(body))

      const res = await axios.post<string>(url, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
        responseType: 'text',
      })

      const xml = typeof res.data === 'string' ? res.data : String(res.data ?? '')
      if (cfg.debug) console.log('[GlideAjax] XML <-', xml.slice(0, 500))
      if (cb) cb(xml)
      return xml
    } catch (err) {
      cfg.onError?.(err, { processor: this.processor, params: { ...this.params } })
      throw err
    }
  }
}
