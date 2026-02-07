import { getAxiosInstance } from '@kit/utils/axios-client'

export class GI18n {
  private readonly messages: Record<string, string>
  private readonly inflightByKey = new Map<string, Promise<void>>()

  constructor(messages: Record<string, string>) {
    this.messages = { ...messages }
  }

  getMessage(key: string, callback?: (message: string) => void): string {
    const cached = this.getCachedMessage(key)
    if (cached !== undefined) {
      callback?.(cached)
      return cached
    }

    void (async () => {
      const serverMessages = await this.getMessagesFromServer([key])
      const resolved = serverMessages[key] ?? this.getCachedMessage(key) ?? key
      callback?.(resolved)
    })()

    return key
  }

  getMessages(keys: string[], callback?: (messages: Record<string, string>) => void): Record<string, string> {
    const missingKeys: string[] = []
    const resolved = Object.fromEntries(
      keys.map(key => {
        const cached = this.getCachedMessage(key)
        if (cached === undefined) missingKeys.push(key)
        return [key, cached ?? key]
      })
    )

    if (missingKeys.length === 0) {
      callback?.(resolved)
      return resolved
    }

    void (async () => {
      const serverMessages = await this.getMessagesFromServer(missingKeys)
      const merged = {
        ...resolved,
        ...Object.fromEntries(keys.map(key => [key, serverMessages[key] ?? this.getCachedMessage(key) ?? key])),
      }
      callback?.(merged)
    })()

    return resolved
  }

  format(message: string, map?: Record<string, string>): string {
    if (typeof message !== 'string' || !map || typeof map !== 'object') {
      return message
    }

    return message.replace(/\{([^{}]+)\}/g, (token, key: string) => {
      if (!Object.prototype.hasOwnProperty.call(map, key)) {
        return token
      }
      const value = map[key]
      return value == null ? '' : String(value)
    })
  }

  private getCachedMessage(key: string) {
    return this.messages[key]
  }

  private setCachedMessages(messages: Record<string, string>) {
    Object.entries(messages).forEach(([key, value]) => {
      this.messages[key] = value
    })
  }

  private async getMessagesFromServer(keys: string[]): Promise<Record<string, string>> {
    const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
    const missingKeys = uniqueKeys.filter(key => this.getCachedMessage(key) === undefined)

    if (missingKeys.length === 0) {
      return Object.fromEntries(uniqueKeys.map(key => [key, this.getCachedMessage(key)!]))
    }

    const keysToFetch = missingKeys.filter(key => !this.inflightByKey.has(key))

    if (keysToFetch.length > 0) {
      const fetchPromise = (async () => {
        try {
          const axios = getAxiosInstance()
          const response = await axios.post('/angular.do?sysparm_type=message', {
            messages: keysToFetch,
          })

          const serverMessages = (response.data?.messages ?? {}) as Record<string, string>
          this.setCachedMessages(serverMessages)
        } catch (error) {
          console.error('[g_i18n] failed to fetch messages from server', error)
        } finally {
          keysToFetch.forEach(key => this.inflightByKey.delete(key))
        }
      })()

      keysToFetch.forEach(key => this.inflightByKey.set(key, fetchPromise))
    }

    const waitForKeys = missingKeys
      .map(key => this.inflightByKey.get(key))
      .filter((promise): promise is Promise<void> => !!promise)

    if (waitForKeys.length > 0) {
      await Promise.allSettled(waitForKeys)
    }

    const resolved: Record<string, string> = {}
    uniqueKeys.forEach(key => {
      const message = this.getCachedMessage(key)
      if (message !== undefined) {
        resolved[key] = message
      }
    })

    return resolved
  }
}
