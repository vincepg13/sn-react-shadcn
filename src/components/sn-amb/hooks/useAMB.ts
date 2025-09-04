/**
 * This file is sourced from - https://github.com/lucasschirm/amb-client-react
 * 
 * Modified to fix the channel listener subscription not firing the provided callback
 *
 * Then rewrapped in the "useRecordWatch" hook to provide a more convenient API for consuming record updates.
 */
import { useState } from 'react'
import { SnAmbMessage } from '@kit/types/record-watch'
import amb, { type subscribeCallback, type AmbClient, type AmbChannelListener } from 'amb-client-js'

let ambClient: AmbClient | null = null

type ChannelListenerMap = { subscription: AmbChannelListener | null; listeners: subscribeCallback[] }

function getAmbClient() {
  return ambClient || amb.getClient()
}

export default function useAMB() {
  const [channelsListeners, setChannelsListeners] = useState<Map<string, ChannelListenerMap>>(new Map())

  const subscribe = (channel: string, callback: subscribeCallback) => {
    const ambClient = getAmbClient()

    if (!channelsListeners.has(channel)) {
      channelsListeners.set(channel, {
        subscription: null,
        listeners: [],
      })
    }

    const channelListener = channelsListeners.get(channel)

    if (!channelListener) {
      throw new Error(`Channel ${channel} not found in channelsListeners map.`)
    }

    const listeners = channelListener.listeners

    const idx = listeners.push(callback)

    if (idx === 1) {
      // FIX: actually subscribe to the channel obj and not via subscription callback
      const channelObj = ambClient.getChannel(channel)
      channelListener.subscription = channelObj.subscribe(message => {
        const current = channelsListeners.get(channel)
        const currentListeners = current?.listeners
        if (currentListeners) {
          for (const listener of currentListeners) {
            listener(message as SnAmbMessage)
          }
        }
      }) as AmbChannelListener
    }

    setChannelsListeners(new Map(channelsListeners))

    return () => {
      const current = channelsListeners.get(channel)
      const currentListeners = current?.listeners
      if (currentListeners) {
        currentListeners.splice(idx - 1, 1)
        setChannelsListeners(new Map(channelsListeners))
      }
      if (currentListeners && currentListeners.length === 0) {
        current?.subscription?.unsubscribe()
      }
    }
  }

  return { subscribe }
}
