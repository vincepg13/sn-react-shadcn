import { getAxiosInstance } from '@kit/utils/axios-client'

export async function getAutocompleteData(table: string, field: string, controller: AbortController | AbortSignal) {
  const res = await getAxiosInstance().get(`/api/now/sp/editor/autocomplete/table/${table}/field/${field}`, {
    signal: controller instanceof AbortController ? controller.signal : controller,
  })
  // console.log('RES', JSON.stringify(res.data.result, null, 2))
  return res.data.result
}
