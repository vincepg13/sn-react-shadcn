import { isAxiosError } from 'axios'
import { useEffect, useRef, useState } from 'react'
import { SnPersonaliseList } from './sn-personalise-list'
import { getPersonalList, setPersonalList } from '@kit/utils/table-api'
import { SnListItem, SnPersonalList } from '@kit/types/table-schema'

type SnPersonaliseProps = {
  lmEndpoint: string
  table: string
  view?: string
  onChange?: () => void
}

export function SnPersonalise({ lmEndpoint, table, view, onChange }: SnPersonaliseProps) {
  const key = `${table}|${view || ''}`
  const controllerRef = useRef(new AbortController())
  const [listMechanic, setListMechanic] = useState<SnPersonalList | null>(null)

  const saveList = async (items?: SnListItem[]) => {
    controllerRef.current.abort()
    controllerRef.current = new AbortController()

    const fields = items?.map(i => i.value)
    await setPersonalList(lmEndpoint, table, view, fields, controllerRef.current.signal)
    setListMechanic(prev => ({ ...prev, selected: items || prev?.selected, isUserList: !!items }) as SnPersonalList)
    onChange?.()
  }

  useEffect(() => {
    controllerRef.current.abort()
    controllerRef.current = new AbortController()

    const fetchListMeta = async () => {
      try {
        const meta = await getPersonalList(lmEndpoint, table, controllerRef.current.signal, view)
        setListMechanic(meta)
      } catch (e) {
        if (isAxiosError(e) && e.code === 'ERR_CANCELED') return
        console.error('Error fetching personal list:', e)
      }
    }

    fetchListMeta()

    return () => controllerRef.current.abort()
  }, [lmEndpoint, table, view])

  if (!listMechanic) return null

  return <SnPersonaliseList key={key} {...listMechanic} onSave={saveList} />
}
