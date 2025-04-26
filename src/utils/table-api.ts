import axios from 'axios'
import { SnRow, SnColSchemea, SnListPref, SnListView, SnListViewElement } from '../types/table-schema'

type SnApiResponse<T = []> = {
  status: number,
  data: {
    result: T
  }
  headers: {
    'x-total-count'?: string
  }
}

export function getViewPreference(
  table: string,
  controller: AbortController,
  view?: string
): Promise<SnApiResponse<SnListPref[]>> {
  if (view !== undefined) {
    return Promise.resolve({ status: 200, headers: {}, data: { result: [{ value: view }] } })
  } else {
    return axios.get(
      `/api/now/table/sys_user_preference?sysparm_query=user=javascript:gs.getUserID()^name=${table}_list.view`,
      {
        signal: controller.signal,
        validateStatus: (status) => status >= 200 && status < 300,
      }
    )
  }
}

export function getListView(
  table: string,
  view: string,
  controller: AbortController
): Promise<SnApiResponse<SnListView[]>> {
  return axios.get(
    `
    /api/now/table/sys_ui_list?sysparm_query=name=${table}^view.name=${view}^sys_user=javascript:gs.getUserID()^ORsys_userISEMPTY^parentISEMPTY^ORDERBYDESCsys_user&sysparm_fields=name,sys_id,sys_user&sysparm_exclude_reference_link=true
  `,
    {
      signal: controller.signal,
      validateStatus: (status) => status >= 200 && status < 300,
    }
  )
}

export function getListViewElements(
  table: string,
  listViews: SnListView[],
  controller: AbortController
): Promise<SnApiResponse<SnListViewElement[]>> {
  let fieldsQuery = ''

  if (!listViews || !listViews.length) {
    fieldsQuery = `list_id.name=${table}^list_id.parentISEMPTY^list_id.view.name=^list_id.sys_userISEMPTY`
  } else {
    fieldsQuery = `list_id=${listViews[0].sys_id}`
  }

  return axios.get(
    `/api/now/table/sys_ui_list_element?sysparm_fields=element,position&sysparm_query=${fieldsQuery}^ORDERBYposition`,
    {
      signal: controller.signal,
      validateStatus: (status) => status >= 200 && status < 300,
    }
  )
}

export function getTableSchema(table: string, controller: AbortController): Promise<SnApiResponse<SnColSchemea[]>> {
  return axios.get(`/api/now/doc/table/schema/${table}`, {
    signal: controller.signal,
    validateStatus: (status) => status >= 200 && status < 300,
  })
}

export function getTableRows(
  table: string,
  query = '',
  fields: string,
  offset: number,
  pageSize: number,
  controller: AbortController
): Promise<SnApiResponse<SnRow[]>> {
  return axios.get(
    `/api/now/table/${table}?sysparm_query=${query}&sysparm_display_value=all&sysparm_fields=${fields}&sysparm_offset=${offset}&sysparm_limit=${pageSize}`,
    {
      signal: controller.signal,
      validateStatus: (status) => status >= 200 && status < 300,
    }
  )
}
