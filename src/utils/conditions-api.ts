/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuid } from 'uuid'
import { getAxiosInstance } from './axios-client'
import {
  SnConditionGroup,
  SnConditionMap,
  SnConditionModel,
  SnConditionRow,
  SnConditionsApiResult,
} from './../types/condition-schema'

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
      choices: col.choices || undefined,
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

export function parseEncodedQuery(result: any): SnConditionModel {
  return (result.predicates || []).flatMap((predicate: any) =>
    predicate.subpredicates.map(parseCompound)
  );
}

export async function getTableMetadata(table: string, controller: AbortController): Promise<SnConditionMap | false> {
  const axios = getAxiosInstance()

  try {
    const { data } = await axios.get(`/api/now/ui/meta/${table}`, {
      params: { sysparm_operators: true, sysparm_keywords: true },
      signal: controller.signal,
    })

    return data.result?.columns ? normalizeFieldMetadata(data.result.columns as SnConditionsApiResult) : false
  } catch (error) {
    console.error('Error fetching table metadata:', error)
    return false
  }
}

export async function getParsedQuery(
  table: string,
  query: string,
  controller: AbortController
): Promise<SnConditionModel | false> {
  const axios = getAxiosInstance()

  try {
    const { data } = await axios.get(`/api/now/ui/query_parse/${table}/map`, {
      params: { sysparm_query: query },
      signal: controller.signal,
    })

    return data?.result ? parseEncodedQuery(data.result) : false
  } catch (err) {
    console.error('Error parsing encoded query:', err)
    return false
  }
}
