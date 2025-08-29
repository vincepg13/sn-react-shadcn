import useAMB from "./useAMB"
import { useEffect } from "react"
import { subscribeCallback } from "amb-client-js"

function encodeQuery(str: string) {
  return btoa(str).replace(/=/g, '-')
}

export function useRecordWatch(table: string, query: string, callback: subscribeCallback) {
  const amb = useAMB()

  useEffect(() => {
    const unsubscribe = amb.subscribe(`/rw/default/${table}/` + encodeQuery(query), callback)
    return () => unsubscribe()
  }, [amb, table, query, callback])
}