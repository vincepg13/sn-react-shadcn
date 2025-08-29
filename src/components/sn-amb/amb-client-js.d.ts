
//added subscribe
declare module 'amb-client-js' {
  export interface AmbClient {
    getChannel(
      channel: string,
      options?: {
        subscriptionCallback?: subscribeCallback
      }
    ): AmbChannelListener
    connect(): void
    disconnect(): void
  }
  export interface AmbChannelListener {
    subscribe(callback: subscribeCallback): AmbChannelListener
    unsubscribe: () => void
  }
  export type subscribeCallback = (message: unknown) => void
  export function getClient(): AmbClient
  const amb: {
    getClient: typeof getClient
  }
  export default amb
}
