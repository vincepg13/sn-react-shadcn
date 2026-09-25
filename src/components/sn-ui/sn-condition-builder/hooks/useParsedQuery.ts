import { v4 as uuid } from 'uuid'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [parsedQuery, setParsedQuery] = useState<{
    model: SnConditionModel
    source: string
  } | null>(null)
  const modelRequestRef = useRef(0)
  const displayRequestRef = useRef(0)

  const getQuerySource = useCallback((query: string) => JSON.stringify([table, query]), [table])

  const queryParser = useCallback(
    async (controller: AbortController, newQuery?: string, setQuery = true, setDisplay = true) => {
      const query = newQuery ?? (setQuery ? encodedQuery : '')
      const modelRequest = setQuery ? ++modelRequestRef.current : null
      const displayRequest = setDisplay ? ++displayRequestRef.current : null

      if (!query) {
        if (setQuery && modelRequest === modelRequestRef.current) {
          setParsedQuery({ model: getEmptyQueryModel(), source: getQuerySource(query) })
        }
        if (setDisplay && displayRequest === displayRequestRef.current) setQueryDisplay(null)
        return
      }

      const handleError = (message: string) => {
        if (controller.signal.aborted) return
        const isCurrentModelRequest = setQuery && modelRequest === modelRequestRef.current
        const isCurrentDisplayRequest = setDisplay && displayRequest === displayRequestRef.current
        if (isCurrentModelRequest || isCurrentDisplayRequest) setError(message)
      }

      const parsed = await getParsedQuery(table, query, enableDisplay, controller, handleError)
      if (!parsed || controller.signal.aborted) return

      if (setQuery && modelRequest === modelRequestRef.current) {
        setParsedQuery({ model: parsed.model, source: getQuerySource(query) })
      }
      if (setDisplay && displayRequest === displayRequestRef.current) {
        setQueryDisplay(parsed.display || null)
      }
    },
    [table, encodedQuery, enableDisplay, getQuerySource, setError]
  )

  useEffect(() => {
    if (!table) return
    const controller = new AbortController()
    const source = getQuerySource(encodedQuery)

    setParsedQuery(prev => (prev?.source === source ? prev : null))

    queryParser(controller, encodedQuery, true, true)
    return () => controller.abort()
  }, [table, encodedQuery, getQuerySource, queryParser])

  return {
    queryModel: parsedQuery?.model || null,
    querySource: parsedQuery?.source || null,
    queryDisplay,
    encodedQuery,
    queryParser,
    setQueryDisplay,
  }
}
