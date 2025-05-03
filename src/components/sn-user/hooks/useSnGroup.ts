/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { SnGroup } from '../../../types/user-schema'
import { SnRow } from '../../../types/table-schema'
import { getTableRows } from '../../../utils/table-api'
import { getAxiosInstance } from '../../../utils/axios-client'

const axios = getAxiosInstance()

export function useSnGroup(guid: string, getImLink?: (row: SnRow, key: string) => string) {
  const [group, setGroup] = useState<Omit<SnGroup, 'members'> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fields = 'name,description,manager,manager.photo,manager.email'

    const fetch = async () => {
      try {
        const res = await getTableRows('sys_user_group', `sys_id=${guid}`, fields, 0, 1, controller)
        if (!res.data?.result?.length) {
          setError('Group not found')
          setGroup(null)
          return
        }

        const groupRow = res.data.result[0]
        const base: Omit<SnGroup, 'members'> = {
          name: groupRow.name.display_value,
          description: groupRow.description.display_value,
        }

        if (groupRow.manager?.value) {
          const photo = groupRow['manager.photo']?.display_value
          base.manager = {
            name: groupRow.manager.display_value,
            email: groupRow['manager.email'].display_value,
            image: photo ? `/${photo}` : '',
            im: getImLink?.(groupRow, 'manager.email'),
          }
        }

        setGroup(base)
      } catch (e) {
        if (axios.isAxiosError(e) && e.code === 'ERR_CANCELED') return
        console.error('Error loading group', e)
        setError('Failed to load group data')
      }
    }

    fetch()
    return () => controller.abort()
  }, [guid])

  return { group, error }
}