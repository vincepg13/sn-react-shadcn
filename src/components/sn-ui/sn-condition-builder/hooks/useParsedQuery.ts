import { v4 as uuid } from 'uuid'
import { useEffect, useState } from 'react'
import { getParsedQuery } from '@kit/utils/conditions-api'
import { SnConditionModel } from '@kit/types/condition-schema'

function getEmptyQueryModel(): SnConditionModel {
  return [
    {
      id: uuid(),
      type: 'and',
      conditions: [
        {
          id: uuid(),
          type: 'and',
          conditions: [
            {
              id: uuid(),
              type: 'condition',
              field: '',
              operator: '',
              value: '',
            },
          ],
        },
      ],
    },
  ]
}

export function useParsedQuery(table: string, encodedQuery: string, setError: (msg: string) => void) {
  const [queryModel, setQueryModel] = useState<SnConditionModel | null>(null)

  useEffect(() => {
    if (!table) return
    setQueryModel(null)

    if (!encodedQuery) return setQueryModel(getEmptyQueryModel())
    const controller = new AbortController()

    const fetch = async () => {
      const parsed = await getParsedQuery(table, encodedQuery, controller, setError)
      if (parsed) setQueryModel(parsed)
    }

    fetch()
    return () => controller.abort()
  }, [table, encodedQuery, setError])

  return queryModel
}
