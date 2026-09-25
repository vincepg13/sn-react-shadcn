import { useEffect, useRef, useState } from 'react'
import { getActiveCurrencies, getDateMetadata, getTableMetadata } from '@kit/utils/conditions-api'
import {
  SnConditionNode,
  SnConditionRow,
  SnConditionMap,
  SnDateTimeMeta,
  SnFieldCurrencyChoice,
} from '@kit/types/condition-schema'

function hasFieldTypeCondition(nodes: SnConditionNode[], fieldTypes: string[]): boolean {
  return nodes.some(node => {
    if (node.type === 'condition') {
      return fieldTypes.includes(node.fieldType!)
    }
    if (Array.isArray(node.conditions)) {
      return hasFieldTypeCondition(node.conditions, fieldTypes)
    }
    return false
  })
}

export function useFieldCache(
  table: string,
  columns: SnConditionMap,
  queryModel: SnConditionNode[],
  dateMeta: SnDateTimeMeta | null,
  currencyMeta: SnFieldCurrencyChoice[],
  setDateMeta: (meta: SnDateTimeMeta) => void,
  setCurrencyMeta: (meta: SnFieldCurrencyChoice[]) => void
) {
  const [cacheLoaded, setCacheLoaded] = useState<Record<string, boolean>>({ fields: false })
  const [fieldsByTable, setFieldsByTable] = useState<Record<string, SnConditionMap>>({ [table]: columns })
  const fieldsRef = useRef(fieldsByTable)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    fieldsRef.current = fieldsByTable
  }, [fieldsByTable])

  useEffect(() => {
    fieldsRef.current = { ...fieldsRef.current, [table]: columns }
    setFieldsByTable(prev => (prev[table] === columns ? prev : { ...prev, [table]: columns }))
  }, [columns, table])

  useEffect(() => {
    const hasGlideDate = hasFieldTypeCondition(queryModel, ['glide_date', 'glide_date_time', 'date', 'calendar_date_time', 'due_date', 'date_time'])
    const hasCurrency = hasFieldTypeCondition(queryModel, ['currency', 'currency2', 'price'])

    setCacheLoaded(prev => ({
      ...prev,
      dateMeta: !hasGlideDate || !!dateMeta,
      currencyMeta: !hasCurrency || currencyMeta.length > 0,
    }))

    if (!hasGlideDate && !hasCurrency) {
      isFirstLoad.current = false
      return
    }

    const controller = new AbortController()

    if (hasGlideDate && !dateMeta) {
      if (isFirstLoad.current) setCacheLoaded(prev => ({ ...prev, dateMeta: false }))
      const fetchDateMeta = async () => {
        const fetchedDateMeta = await getDateMetadata(table, controller)
        if (fetchedDateMeta && !controller.signal.aborted) {
          setDateMeta(fetchedDateMeta)
          setCacheLoaded(prev => ({ ...prev, dateMeta: true }))
        }
      }

      fetchDateMeta()
    }

    if (hasCurrency && !currencyMeta.length) {
      if (isFirstLoad.current) setCacheLoaded(prev => ({ ...prev, currencyMeta: false }))
      const fetchCurrencyMeta = async () => {
        const currencies = await getActiveCurrencies(controller)
        if (currencies && !controller.signal.aborted) {
          setCurrencyMeta(currencies)
          setCacheLoaded(prev => ({ ...prev, currencyMeta: true }))
        }
      }

      fetchCurrencyMeta()
    }
    isFirstLoad.current = false
    return () => controller.abort()
  }, [currencyMeta.length, dateMeta, queryModel, setCurrencyMeta, setDateMeta, table])

  useEffect(() => {
    const controller = new AbortController()

    const preloadMetadata = async () => {
      const loadTracker: boolean[] = []

      const resolvePath = async (node: SnConditionRow): Promise<string> => {
        if (!node.references?.length) {
          loadTracker.push(true)
          return table
        }

        const targetTable = node.references[node.references.length - 2].reference_table
        if (!fieldsRef.current[targetTable]) {
          const meta = await getTableMetadata(targetTable, controller)
          if (controller.signal.aborted) return targetTable
          loadTracker.push(!!meta)
          if (meta) {
            fieldsRef.current = { ...fieldsRef.current, [targetTable]: meta }
            setFieldsByTable(prev => ({ ...prev, [targetTable]: meta }))
          }
        } else {
          loadTracker.push(true)
        }

        return targetTable
      }

      const walkModel = async (nodes: SnConditionNode[]) => {
        for (const node of nodes) {
          if (node.type === 'condition') {
            const resolvedTable = await resolvePath(node)
            if (controller.signal.aborted) return
            node.fieldLabel = node.fieldLabel?.replace(/ \. /g, '/')
            ;(node as SnConditionRow).table = resolvedTable
          } else {
            await walkModel(node.conditions)
          }
        }
      }

      await walkModel(queryModel)
      if (!controller.signal.aborted) {
        setCacheLoaded(prev => ({ ...prev, fields: loadTracker.some(Boolean) }))
      }
    }

    preloadMetadata()
    return () => controller.abort()
  }, [queryModel, table])

  return {
    cacheLoaded,
    fieldsByTable,
    setFieldsByTable,
  }
}
