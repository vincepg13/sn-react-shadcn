import { GI18n } from './i18n'

export class NowApi {
  public readonly g_i18n: GI18n

  constructor(messages: Record<string, string>) {
    this.g_i18n = new GI18n(messages)
  }
}
