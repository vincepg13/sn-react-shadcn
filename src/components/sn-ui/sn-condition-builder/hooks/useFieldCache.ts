import { useEffect, useRef, useState } from 'react'
import { getTableMetadata } from '@kit/utils/conditions-api'
import { SnConditionNode, SnConditionRow, SnConditionMap } from '@kit/types/condition-schema'

export function useFieldCache(table: string, columns: SnConditionMap, queryModel: SnConditionNode[]) {
  const [cacheLoaded, setCacheLoaded] = useState(false)
  const [fieldsByTable, setFieldsByTable] = useState<Record<string, SnConditionMap>>({ [table]: columns })
  const fieldsRef = useRef(fieldsByTable)
  const loadTracker = useRef<boolean[]>([])

  useEffect(() => {
    fieldsRef.current = fieldsByTable
  }, [fieldsByTable])

  useEffect(() => {
    const controller = new AbortController()

    const preloadMetadata = async () => {
      loadTracker.current = []

      const resolvePath = async (node: SnConditionRow): Promise<string> => {
        if (!node.references?.length) {
          loadTracker.current.push(true)
          return table
        }

        const targetTable = node.references[node.references.length - 2].reference_table
        if (!fieldsRef.current[targetTable]) {
          const meta = await getTableMetadata(targetTable, controller)
          loadTracker.current.push(!!meta)
          if (meta) {
            fieldsRef.current = { ...fieldsRef.current, [targetTable]: meta }
            setFieldsByTable(prev => ({ ...prev, [targetTable]: meta }))
          }
        }

        return targetTable
      }

      const walkModel = async (nodes: SnConditionNode[]) => {
        for (const node of nodes) {
          if (node.type === 'condition') {
            const resolvedTable = await resolvePath(node)
            node.fieldLabel = node.fieldLabel?.replace(/ \. /g, '/')
            ;(node as SnConditionRow).table = resolvedTable
          } else {
            await walkModel(node.conditions)
          }
        }
      }

      await walkModel(queryModel)
      setCacheLoaded(loadTracker.current.some(Boolean))
    }

    preloadMetadata()
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return {
    cacheLoaded,
    fieldsByTable,
    setFieldsByTable,
  }
}
