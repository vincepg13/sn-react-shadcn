import { useEffect, useState } from 'react'
import { getPersonalList } from '@kit/utils/table-api'
import { SnPersonalList } from '@kit/types/table-schema'
import { SnPersonaliseList } from './sn-personalise-list'

type SnPersonaliseProps = {
  lmEndpoint: string
  table: string
  view?: string
}

export function SnPersonalise({ lmEndpoint, table, view }: SnPersonaliseProps) {
  const [personalList, setPersonalList] = useState<SnPersonalList | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    const fetchListMeta = async () => {
      const meta = await getPersonalList(lmEndpoint, table, controller.signal, view)
      console.log('Table Schema:', meta)
      setPersonalList(meta)
    }

    fetchListMeta()

    return () => controller.abort()
  }, [lmEndpoint, table, view])

  if (!personalList) return null

  return <SnPersonaliseList {...personalList} onSave={items => console.log("SAVE", items)} onReset={() => console.log('Reset')} />
}
  