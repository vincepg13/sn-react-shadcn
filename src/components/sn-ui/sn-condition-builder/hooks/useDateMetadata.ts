import { SnDateTimeMeta } from '@kit/types/condition-schema'
import { getDateMetadata } from '@kit/utils/conditions-api'
import { Dispatch, SetStateAction, useEffect } from 'react'

export function useDateMetadata(
  table: string,
  fieldType: string,
  dateMeta: SnDateTimeMeta | null,
  setDateMeta: Dispatch<SetStateAction<SnDateTimeMeta | null>>
) {
  useEffect(() => {
    console.log('useDateMetadata', table, fieldType, dateMeta)
    if (dateMeta || !fieldType.startsWith('glide_date')) return

    const controller = new AbortController()
    const fetchDateMeta = async () => {
      const dateMeta = await getDateMetadata(table, controller)
      if (dateMeta) setDateMeta(dateMeta)
    }

    fetchDateMeta()
    return () => controller.abort()
  }, [fieldType, dateMeta, setDateMeta, table])
}
