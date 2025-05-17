/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAxiosInstance } from './axios-client'
import { SnFieldChoiceItem, SnFieldsSchema } from '@kit/types/form-schema'

export function getFormData(metadataApi: string, controller: AbortController): Promise<any> {
  const axios = getAxiosInstance()
  return axios.get(metadataApi, {
    signal: controller.signal,
    validateStatus: status => status >= 200 && status < 300,
  })
}

export function postFormAction(table: string, recordID: string, action: string, data: SnFieldsSchema) {
  const axios = getAxiosInstance()
  return axios.post(`/api/now/sp/uiaction/${action}`, {
    table,
    recordID,
    data,
  })
}

export async function getTableDisplayFields(table: string, customApi?: string) {
  if (!customApi) return _getTableDisplayFieldDictionary(table)

  try {
    var t = await _getTableDisplayFieldCustom(customApi, table)
    return t
  } catch (error) {
    console.error('Error fetching custom display fields, falling back to dictionary:', error)
  }
  return _getTableDisplayFieldDictionary(table)
}

async function _getTableDisplayFieldCustom(fieldDisplayApi: string, table: string): Promise<string[]> {
  const axios = getAxiosInstance()
  const customDisplay = await axios.get(`${fieldDisplayApi}/${table}`).then(res => {
    return res.data.result.display
  })
  return [customDisplay]
}

async function _getTableDisplayFieldDictionary(table: string): Promise<string[]> {
  const axios = getAxiosInstance()
  const dictionaryDisplay = await axios
    .get(`/api/now/table/sys_dictionary?sysparm_query=name=${table}^display=true`)
    .then(res => {
      return res.data.result.map((item: { element: string }) => item.element)
    })
  return dictionaryDisplay
}

export async function getFieldList(table: string, controller: AbortController): Promise<SnFieldChoiceItem[]> {
  let fieldList: SnFieldChoiceItem[] = []
  const axios = getAxiosInstance()
  try {
    fieldList = await axios
      .get(`/angular.do?sysparm_type=table_fields&exclude_formatters=true&fd_table=${table}`, {
        signal: controller.signal,
      })
      .then(res => res.data)
  } catch (error) {
    console.error('Error fetching field list:', error)
  }
  return fieldList
}

export function buildReferenceQuery({
  columns,
  term,
  operator = 'LIKE',
  orderBy,
  excludeValues,
}: {
  columns: string[]
  term: string
  operator?: string
  orderBy?: string[]
  excludeValues?: string[]
}): string {
  const queryParts = columns.map(col => {
    let q = `${col}${operator}${term}`
    if (term === '') q += `^${col}ISNOTEMPTY`
    return q
  })

  let query = queryParts.join('^NQ')

  if (excludeValues && excludeValues.length > 0) {
    query += `^sys_idNOT IN${excludeValues.join(',')}`
  }

  if (orderBy && orderBy.length > 0) {
    orderBy.forEach(col => {
      query += `^ORDERBY${col}`
    })
  }

  return query + '^EQ'
}

export function getRefData({
  table,
  targetTable,
  targetField,
  targetSysId,
  q,
  qualifier,
  requiredFields,
  recordValues,
  count = 20,
  start = 0,
}: {
  table: string
  targetTable: string
  targetField: string
  targetSysId: string
  q: string
  qualifier: string
  requiredFields?: string[]
  recordValues?: Record<string, any>
  count?: number
  start?: number
}): Promise<any[]> {
  const axios = getAxiosInstance()

  const payload: Record<string, any> = {
    start,
    count,
    table,
    sysparm_target_table: targetTable,
    sysparm_target_sys_id: targetSysId,
    sysparm_target_field: targetField,
    q,
    qualifier,
    r: qualifier,
  }

  if (requiredFields?.length) {
    payload.required_fields = requiredFields.join(':')
  }

  if (recordValues) {
    payload.sysparm_record_values = recordValues
  }

  return axios.post('/angular.do?sysparm_type=sp_ref_list_data&sysparm_cancelable=true', payload).then(res => {
    return res.data?.items || []
  })
}
