import { SnAttachment } from '@kit/types/attachment-schema'
import { getAxiosInstance } from './axios-client'

export async function getAttachments(
  table: string,
  guid: string,
  controller: AbortController | AbortSignal
): Promise<SnAttachment[]> {
  const axios = getAxiosInstance()
  const response = await axios.get(
    `/angular.do?sysparm_type=ngk_attachments&action=list&sys_id=${guid}&table=${table}`,
    { signal: controller instanceof AbortController ? controller.signal : controller }
  )
  return response.data.files || []
}

export async function deleteAttachment(guid: string): Promise<void> {
  const axios = getAxiosInstance()
  await axios.get(`/angular.do?sysparm_type=ngk_attachments&action=delete&sys_id=${guid}`)
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

  return await axios.post(url, formData, cont).then(res => res.data)
}
