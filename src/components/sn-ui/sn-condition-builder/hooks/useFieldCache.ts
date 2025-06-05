import { useEffect, useRef, useState } from 'react'
import { getTableMetadata } from '@kit/utils/conditions-api'
import { SnConditionNode, SnConditionRow, SnConditionMap } from '@kit/types/condition-schema'

export function useFieldCache(table: string, columns: SnConditionMap, queryModel: SnConditionNode[]) {
  const [fieldsByTable, setFieldsByTable] = useState<Record<string, SnConditionMap>>({ [table]: columns })
  const fieldsRef = useRef(fieldsByTable)

  useEffect(() => {
    fieldsRef.current = fieldsByTable
  }, [fieldsByTable])

  useEffect(() => {
    const controller = new AbortController()

    const preloadMetadata = async () => {
      const baseTable = table

      const resolvePath = async (fieldPath: string): Promise<string> => {
        const parts = fieldPath.split('.')
        let currentTable = baseTable

        for (const part of parts) {
          if (!fieldsRef.current[currentTable]) {
            const meta = await getTableMetadata(currentTable, controller)
            if (meta) {
              fieldsRef.current = { ...fieldsRef.current, [currentTable]: meta }
              setFieldsByTable(prev => ({ ...prev, [currentTable]: meta }))
            }
          }

          const field = fieldsRef.current[currentTable]?.[part]
          if (!field?.reference) return currentTable
          currentTable = field.reference
        }

        return currentTable
      }

      const walkModel = async (nodes: SnConditionNode[]) => {
        for (const node of nodes) {
          if (node.type === 'condition') {
            const resolvedTable = await resolvePath(node.field)
            ;(node as SnConditionRow).table = resolvedTable
          } else {
            await walkModel(node.conditions)
          }
        }
      }

      await walkModel(queryModel)
    }

    preloadMetadata()
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return {
    fieldsByTable,
    setFieldsByTable,
  }
}
