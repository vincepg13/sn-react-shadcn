import { v4 as uuid } from 'uuid'
import { useCallback, useEffect, useState } from 'react'
import { getParsedQuery } from '@kit/utils/conditions-api'
import { SnConditionDisplayArray, SnConditionModel } from '@kit/types/condition-schema'

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

export function useParsedQuery(
  table: string,
  encodedQuery: string,
  enableDisplay: boolean,
  setError: (msg: string) => void
) {
  const [queryDisplay, setQueryDisplay] = useState<SnConditionDisplayArray | null>(null)
  const [queryModel, setQueryModel] = useState<SnConditionModel | null>(null)

  const queryParser = useCallback(
    async (controller: AbortController, newQuery?: string, setQuery = true, setDisplay = true) => {
      const query = setQuery ? newQuery || encodedQuery : newQuery || ''
      if (!setQuery && !query) return setQueryDisplay(null)

      const parsed = await getParsedQuery(table, query, enableDisplay, controller, setError)
      if (parsed) {
        if (setQuery) setQueryModel(parsed.model)
        if (setDisplay) setQueryDisplay(parsed.display || null)
      }
    },
    [table, encodedQuery, enableDisplay, setError]
  )

  useEffect(() => {
    if (!table) return
    setQueryModel(null)

    if (!encodedQuery) return setQueryModel(getEmptyQueryModel())
    const controller = new AbortController()

    queryParser(controller, encodedQuery, true, true)
    return () => controller.abort()
  }, [table, encodedQuery, setError, enableDisplay, queryParser])

  return { queryModel, queryDisplay, encodedQuery, queryParser, setQueryDisplay }
}
