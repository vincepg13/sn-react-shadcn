import ax from 'axios'
import { parseAnswer } from '@kit/utils/xml-parser'
import { getAxiosInstance, getGlideAjaxConfig } from '../utils/axios-client'

/**
 * Default AJAX configuration for GlideAjax requests.
 * Can be overwritten where necessary.
 */
const DEFAULTS = {
  endpoint: '/xmlhttp.do',
  defaults: {
    sysparm_want_session_messages: 'true',
    'ni.nolog.x_referer': 'ignore',
  },
}

/**
 * GlideAjax class for interacting with ServiceNow Script Includes via AJAX. Designed to mirror
 * the ServiceNow client-side API for flawless AJAX integration in React.
 */
export class GlideAjax {
  private processor: string
  private params: Record<string, string> = {}

  /**
   * Constructs a new GlideAjax instance.
   *
   * @param processor The name of the Script Include to call.
   * @throws Error if processor is not provided.
   */
  constructor(processor: string, private controller?: AbortController) {
    if (!processor) throw new Error('GlideAjax requires a Script Include name')
    this.processor = processor
  }

  /**
   * Adds a parameter to the GlideAjax request.
   *
   * Will execute in a none typed context so we ensure string typing for the value
   *
   * @param name The parameter name.
   * @param value The parameter value.
   *
   * @return The GlideAjax instance (for chaining).
   */
  addParam(name: string, value: string) {
    this.params[name] = value != null ? String(value) : ''
    return this
  }

  /**
   * Sets the scope for the GlideAjax request.
   *
   * @param scope The scope value.
   *
   * @returns The GlideAjax instance (for chaining).
   */
  setScope(scope: string) {
    if (scope) this.params['sysparm_scope'] = String(scope)
    return this
  }

  /**
   * Sends the AJAX request and returns the extracted answer from the XML response.
   *
   * @param cb Optional callback to receive the answer string.
   *
   * @returns Promise resolving to the answer string.
   */
  async getXMLAnswer(cb?: (answer: string) => void): Promise<string> {
    const xml = await this.getXML()
    const { extractAnswer } = getGlideAjaxConfig()
    const answer = (extractAnswer ?? parseAnswer)(xml)

    if (cb) cb(answer)

    return answer
  }

  /**
   * Sends the AJAX request and returns the raw XML response.
   *
   * @param cb Optional callback to receive the XML string.
   * @returns Promise resolving to the XML string.
   *
   * @throws Error if the request fails.
   */
  async getXML(cb?: (xml: string) => void): Promise<string> {
    const axios = getAxiosInstance()
    const cfg = { ...DEFAULTS, ...getGlideAjaxConfig() }

    const url = `${cfg.endpoint}`
    const body = new URLSearchParams({
      ...DEFAULTS.defaults,
      ...(cfg.defaults ?? {}),
      ...this.params,
      sysparm_processor: this.processor,
    })

    try {
      const res = await axios.post<string>(url, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true,
        responseType: 'text',
        signal: this.controller?.signal,
      })

      const xml = typeof res.data === 'string' ? res.data : String(res.data ?? '')
      if (cb) cb(xml)
      return xml
    } catch (err) {
      if (ax.isAxiosError(err) && err.code === 'ERR_CANCELED') return ''
      throw err
    }
  }

  /**
   * Not supported (deprecated in SN Scoped apps & Service Portal). Use getXML()/getXMLAnswer() instead.
   * @throws Error always
   */
  getXMLWait(): never {
    throw new Error('GlideAjax.getXMLWait() is not supported. Use getXML()/getXMLAnswer() (async). ')
  }

  /**
   * Not supported (depends on getXMLWait). Use getXMLAnswer() and store the value you need.
   * @throws Error always
   */
  getAnswer(): never {
    throw new Error('GlideAjax.getAnswer() is not supported. Call getXMLAnswer instead and capture the result.')
  }
}
