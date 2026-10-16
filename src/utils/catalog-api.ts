import axios from 'axios'
import { getAxiosInstance } from './axios-client'
import type {
  SnCatalogMetadata,
  SnCatalogSubmissionResult,
  SnCatalogVariables,
} from '@kit/types/catalog-schema'

const DEFAULT_SERVICE_CATALOG_BASE = '/api/sn_sc/servicecatalog'

function unwrapResult<T>(data: T | { result?: T }): T {
  if (data && typeof data === 'object' && 'result' in data && data.result !== undefined) {
    return data.result
  }
  return data as T
}

export async function getCatalogItemMetadata(
  itemDataApi: string,
  signal?: AbortSignal
): Promise<SnCatalogMetadata> {
  const response = await getAxiosInstance().get(itemDataApi, { signal })
  const metadata = unwrapResult<SnCatalogMetadata>(response.data)

  if (!metadata?.item?._fields || !metadata?.runtime || !Array.isArray(metadata.item._sections)) {
    throw new Error('Catalog metadata response is missing item, runtime, or layout data')
  }

  return metadata
}

type NativeProducerResult = {
  sys_id?: string
  table?: string
  number?: string
  record?: string
  parent_id?: string | null
  parent_table?: string | null
  redirect_url?: string
  redirect_portal_url?: string
  redirect_to?: string
}

export function normalizeCatalogSubmissionResult(result: NativeProducerResult): SnCatalogSubmissionResult {
  if (!result.sys_id || !result.table) {
    throw new Error('ServiceNow did not return the created record identity')
  }

  return {
    sysId: result.sys_id,
    table: result.table,
    number: result.number,
    recordPath: result.record,
    parentId: result.parent_id,
    parentTable: result.parent_table,
    redirectUrl: result.redirect_url,
    redirectPortalUrl: result.redirect_portal_url,
    redirectTo: result.redirect_to,
  }
}

export async function submitCatalogProducer({
  catalogItemId,
  variables,
  serviceCatalogBase = DEFAULT_SERVICE_CATALOG_BASE,
}: {
  catalogItemId: string
  variables: SnCatalogVariables
  serviceCatalogBase?: string
}): Promise<SnCatalogSubmissionResult> {
  const base = serviceCatalogBase.replace(/\/$/, '')
  const url = `${base}/items/${encodeURIComponent(catalogItemId)}/submit_producer`
  const response = await getAxiosInstance().post(url, { variables })
  return normalizeCatalogSubmissionResult(unwrapResult<NativeProducerResult>(response.data))
}

export function getCatalogApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback
  if (error.code === 'ERR_CANCELED') return ''
  return error.response?.data?.error?.message || error.message || fallback
}
