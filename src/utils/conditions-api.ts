/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from 'uuid'
import * as baseAxios from 'axios'
import { getAxiosInstance } from './axios-client'
import {
  SnConditionDisplayArray,
  SnConditionDisplayItem,
  SnConditionGroup,
  SnConditionMap,
  SnConditionModel,
  SnConditionRow,
  SnConditionsApiResult,
  SnDateTimeMeta,
  SnFieldCurrencyChoice,
} from './../types/condition-schema'

/********************************************************************
 *    Utility functions to normalize and parse conditions API data  *
 *******************************************************************/
function normalizeFieldMetadata(columns: SnConditionsApiResult) {
  const fields: SnConditionMap = {}

  Object.entries(columns).forEach(([name, col]) => {
    if (!col || !col.name) {
      console.warn(`Skipping invalid column metadata for ${name}`, col)
      return
    }

    if (!col.filterable) return

    fields[name] = {
      name,
      label: col.label,
      type: col.type,
      reference: col.reference,
      referenceDisplayField: col.reference_display_field,
      referenceKey: col.reference_attributes?.reference_key,
      referenceCols: col.reference_attributes?.ref_ac_columns,
      choices: col.choices || col.dynamic_choices || undefined,
      qualifier: col.ed?.qualifier,
      operators: col.operators || [],
    }
  })

  return fields
}

function parseComparison(c: any): SnConditionRow {
  return {
    id: uuid(),
    type: 'condition',
    field: c.field,
    operator: c.operator,
    value: c.value,
    fieldLabel: c.field_label,
    operatorLabel: c.operator_label,
    displayValue: c.display_value,
    fieldType: c.field_type,
    references: c.reference_fields || [],
    term: c.term,
    termLabel: c.term_label,
  }
}

function parseCompound(comp: any): SnConditionGroup {
  const children = comp.subpredicates.map((sp: any) => {
    return sp.type === 'compound' ? parseCompound(sp) : parseComparison(sp)
  })

  return {
    id: uuid(),
    type: comp.compound_type,
    conditions: children,
  }
}

function buildQueryDisplay(parsed: any): SnConditionDisplayArray | null {
  if (!parsed || !Array.isArray(parsed.predicates)) return null;

  const topLevelOr = parsed.predicates.find((p: any) => p.compound_type === "or");
  if (!topLevelOr || !Array.isArray(topLevelOr.subpredicates)) return null;

  const groups: SnConditionDisplayArray = [];

  for (let i = 0; i < topLevelOr.subpredicates.length; i++) {
    const segment: SnConditionDisplayItem[] = [];
    const index = { j: 0 };
    collectDisplayTerms(topLevelOr.subpredicates[i], segment, i, index);
    groups.push(segment);
  }

  return groups;

  function collectDisplayTerms(node: any, acc: SnConditionDisplayItem[], i: number, index: { j: number }) {
    if (node.type === "compound" && Array.isArray(node.subpredicates)) {
      if (node.compound_type === "or") {
        for (const element of node.subpredicates) {
          if (element.term_label) {
            acc.push({ display: element.term_label, id: `${i}:${index.j}`, or: true });
            index.j++;
          } else if (element.type === "compound") {
            collectDisplayTerms(element, acc, i, index); 
          }
        }
      } else {
        for (const child of node.subpredicates) {
          collectDisplayTerms(child, acc, i, index);
        }
      }
    } else if (node.term_label) {
      acc.push({ display: node.term_label, id: `${i}:${index.j}` });
      index.j++;
    }
  }
}

export function mergeOrItems(groups: SnConditionDisplayArray): SnConditionDisplayArray {
  return groups.map(group => {
    const result: SnConditionDisplayItem[] = []
    let buffer: SnConditionDisplayItem[] = []

    for (const item of group) {
      if (item.or) {
        buffer.push(item)
      } else {
        if (buffer.length > 0) {
          result.push(mergeBuffer(buffer))
          buffer = []
        }
        result.push(item)
      }
    }
    if (buffer.length > 0) {
      result.push(mergeBuffer(buffer))
    }

    return result
  })

  function mergeBuffer(buffer: SnConditionDisplayItem[]): SnConditionDisplayItem {
    return {
      display: buffer.map(i => i.display).join(' .or. '),
      id: buffer[buffer.length - 1].id,
    }
  }
}

/********************************************************************
 *                            API Methods                           *
 *******************************************************************/

export function parseEncodedQuery(result: any): SnConditionModel {
  return (result.predicates || []).flatMap((predicate: any) => predicate.subpredicates.map(parseCompound))
}

export async function getTableMetadata(
  table: string,
  controller: AbortController,
  setError?: (msg: string) => void
): Promise<SnConditionMap | false> {
  const axios = getAxiosInstance()
  const errorMsg = `Failed to fetch metadata for table: ${table}`

  try {
    const { data } = await axios.get(`/api/now/ui/meta/${table}`, {
      params: { sysparm_operators: true, sysparm_keywords: true },
      signal: controller.signal,
    })

    return data.result?.columns ? normalizeFieldMetadata(data.result.columns as SnConditionsApiResult) : false
  } catch (error) {
    if (baseAxios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
    console.error('Error fetching table metadata:', error)
    setError?.(errorMsg)
    return false
  }
}

export async function getParsedQuery(
  table: string,
  query: string,
  display: boolean,
  controller: AbortController,
  setError?: (msg: string) => void
): Promise<{model: SnConditionModel, display?: SnConditionDisplayArray|null} | false> {
  const axios = getAxiosInstance()
  const errorMsg = `Failed to parse query for table: ${table}`

  try {
    const { data } = await axios.get(`/api/now/ui/query_parse/${table}/map`, {
      params: { sysparm_query: query },
      signal: controller.signal,
    })

    const res = data?.result
    if (!res) return false

    return {
      model: parseEncodedQuery(res),
      display: display ? buildQueryDisplay(res) : null,
    }
  } catch (error) {
    if (baseAxios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
    if (setError) setError(errorMsg)
    console.error('Error parsing encoded query:', error)
    return false
  }
}

export async function getDateMetadata(table: string, controller: AbortController): Promise<SnDateTimeMeta | false> {
  const axios = getAxiosInstance()

  try {
    const { data } = await axios.get(`/api/now/ui/date_time?table_name=${table}`, {
      signal: controller.signal,
    })
    return data?.result || false
  } catch (error) {
    if (baseAxios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
    console.error('Error fetching date metadata:', error)
    return false
  }
}

export async function getActiveCurrencies(controller: AbortController): Promise<SnFieldCurrencyChoice[] | false> {
  const axios = getAxiosInstance()

  try {
    const { data } = await axios.get('/api/now/ui/currency/active', { signal: controller.signal })
    return data?.result || false
  } catch (error) {
    if (baseAxios.isAxiosError(error) && error.code === 'ERR_CANCELED') return false
    console.error('Error fetching active currencies:', error)
    return false
  }
}
