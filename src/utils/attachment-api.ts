import { SnAttachment } from '@kit/types/attachment-schema'
import { getAxiosInstance } from './axios-client'

declare global {
  interface Window {
    g_ck?: string
  }
}

export async function getAttachments(
  table: string,
  guid: string,
  controller: AbortController | AbortSignal
): Promise<SnAttachment[]> {
  const axios = getAxiosInstance()
  try {
    const response = await axios.get(
      `/angular.do?sysparm_type=ngk_attachments&action=list&sys_id=${guid}&table=${table}`,
      { signal: controller instanceof AbortController ? controller.signal : controller }
    )
    return response.data.files || []
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return []
  }
}

export async function deleteAttachment(guid: string): Promise<boolean> {
  const axios = getAxiosInstance()
  try {
    await axios.get(`/angular.do?sysparm_type=ngk_attachments&action=delete&sys_id=${guid}`)
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return false
  }
  return true
}

export async function uploadFieldAttachment(file: File, table: string, sysId: string, fieldName: string) {
  return uploadAttachment(file, `ZZ_YY${table}`, sysId, fieldName)
}

export async function uploadAttachment(
  file: File,
  table: string,
  sysId: string,
  fieldName?: string,
  controller?: AbortController | AbortSignal
) {
  const axios = getAxiosInstance()
  const url = `/angular.do?sysparm_type=ngk_attachments&action=add&sys_id=${sysId}&table=${table}&load_attachment_record=true`

  const formData = new FormData()
  formData.append('attachments_modified', 'true')
  formData.append('sysparm_table', table)
  formData.append('sysparm_sys_id', sysId)
  formData.append('sysparm_nostack', 'yes')
  formData.append('attachFile', file)
  if (fieldName) formData.append('field_name', fieldName)

  let cont = controller ? { signal: controller instanceof AbortController ? controller.signal : controller } : {}

  try {
    return await axios.post(url, formData, cont).then(res => res.data)
  } catch (error) {
    console.error('Error uploading image attachment:', error)
    return ''
  }
}
