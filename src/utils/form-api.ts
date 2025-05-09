/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAxiosInstance } from './axios-client'
import { SnFieldsSchema } from '@kit/types/form-schema'

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

export function buildReferenceQuery({
  columns,
  term,
  operator = "LIKE",
  orderBy,
  excludeValues,
}: {
  columns: string[];
  term: string;
  operator?: string;
  orderBy?: string[];
  excludeValues?: string[];
}): string {
  const queryParts = columns.map((col) => {
    let q = `${col}${operator}${term}`;
    if (term === "") q += `^${col}ISNOTEMPTY`;
    return q;
  });

  let query = queryParts.join("^NQ");

  if (excludeValues && excludeValues.length > 0) {
    query += `^sys_idNOT IN${excludeValues.join(",")}`;
  }

  if (orderBy && orderBy.length > 0) {
    orderBy.forEach((col) => {
      query += `^ORDERBY${col}`;
    });
  }

  return query + "^EQ";
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
  table: string;
  targetTable: string;
  targetField: string;
  targetSysId: string;
  q: string;
  qualifier: string;
  requiredFields?: string[];
  recordValues?: Record<string, any>;
  count?: number;
  start?: number;
}): Promise<any[]> {
  const axios = getAxiosInstance();

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
  };

  if (requiredFields?.length) {
    payload.required_fields = requiredFields.join(":");
  }

  if (recordValues) {
    payload.sysparm_record_values = recordValues;
  }

  return axios
    .post("/angular.do?sysparm_type=sp_ref_list_data&sysparm_cancelable=true", payload)
    .then((res) => {
      return res.data?.items || []
    });
}
