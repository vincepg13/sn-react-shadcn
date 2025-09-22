/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { getTableRows } from '../../../utils/table-api'
import { SnRow } from '../../../types/table-schema'
import { SnGroup } from '../../../types/user-schema'
import { isAxiosError } from 'axios'

export function useGroupMembers(
  guid: string,
  currentPage: number,
  pageSize: number,
  getImLink?: (row: SnRow, key: string) => string
) {
  const [members, setMembers] = useState<SnGroup['members']>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const fields = 'user,user.email,user.phone,user.photo,user.avatar'

    const fetch = async () => {
      try {
        const offset = (currentPage - 1) * pageSize
        const res = await getTableRows(
          'sys_user_grmember',
          `group=${guid}^user.active=true^ORDERBYuser.name`,
          fields,
          offset,
          pageSize,
          controller
        )

        if (res.status !== 200) return setMembers([])

        setMembers(
          res.data.result.map((member: SnRow) => {
            const photo = member['user.avatar']?.display_value || member['user.photo']?.display_value

            return {
              name: member.user.display_value,
              email: member['user.email'].display_value,
              phone: member['user.phone'].display_value,
              image: photo ? `/${photo}` : '',
              im: getImLink?.(member, 'user.email'),
            }
          })
        )

        setTotal(+res.headers['x-total-count']! || 0)
      } catch (e) {
        if (isAxiosError(e) && e.code === 'ERR_CANCELED') return
        console.error('Error loading members', e)
        setMembers([])
      }
    }

    fetch()
    return () => controller.abort()
  }, [guid, currentPage, pageSize])

  return { members, total }
}
