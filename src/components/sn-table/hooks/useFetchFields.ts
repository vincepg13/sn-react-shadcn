import { useState, useEffect } from 'react'
import axios from 'axios'
import { getListView, getListViewElements, getViewPreference } from '../../../utils/table-api'
import { SnListViewElement } from '../../../types/table-schema'

export async function fetchFieldsViaView(table: string, signal: AbortSignal, view?: string) {
  const prefRes = await getViewPreference(table, signal, view)
  const tableView = view !== undefined ? view : prefRes.data.result[0]?.value || ''

  const listViewRes = await getListView(table, tableView, signal)
  const elementsRes = await getListViewElements(table, listViewRes.data.result, signal)
  const snFields = elementsRes.data.result
    .filter((f: SnListViewElement) => f.element && !f.element.startsWith('.'))
    .map((f: SnListViewElement) => f.element)

  return { fields: snFields, targetView: tableView }
}

export function useFetchFields({ table, view }: { table: string; view?: string }) {
  const [error, setError] = useState<string>('')
  const [fields, setFields] = useState<string[]>([])
  const [targetView, setTargetView] = useState(view || null)
  const [fieldsTable, setFieldsTable] = useState<string>('')

  useEffect(() => {
    if (!table) {
      console.warn('No table specified for fetching fields')
      return
    }

    const controller = new AbortController()

    const loadFields = async () => {
      try {
        const prefRes = await getViewPreference(table, controller, view)
        const tableView = view !== undefined ? view : prefRes.data.result[0]?.value || ''

        const listViewRes = await getListView(table, tableView, controller)

        if (!listViewRes.data.result || listViewRes.data.result.length === 0) {
          setError(`No list view found for the supplied table: ${table}`)
          setFields([])
          return
        }

        const elementsRes = await getListViewElements(table, listViewRes.data.result, controller)
        const snFields = elementsRes.data.result
          .filter((f: SnListViewElement) => f.element && !f.element.startsWith('.'))
          .map((f: SnListViewElement) => f.element)

        setTargetView(tableView)
        setFields(snFields)
        setFieldsTable(table)
        setError('')
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.code !== 'ERR_CANCELED') {
          setError('Failed to fetch table view')
        }
        setFields([])
      }
    }

    loadFields()

    return () => {
      controller.abort()
    }
  }, [table, view])

  return { fields, fieldsTable, error, targetView }
}
