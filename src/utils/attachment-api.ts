import { getAxiosInstance } from './axios-client'

declare global {
  interface Window {
    g_ck?: string;
  }
}

export async function deleteAttachment(guid: string): Promise<boolean> {
  const axios = getAxiosInstance()
  try {
    await axios.get(`angular.do?sysparm_type=ngk_attachments&action=delete&sys_id=${guid}`)
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return false
  }
  return true
}

export async function uploadFieldAttachment(
  file: File,
  table: string,
  sysId: string,
  fieldName: string,
) {
  const axios = getAxiosInstance()
  const url = `/angular.do?sysparm_type=ngk_attachments&action=add&sys_id=${sysId}&table=${table}&load_attachment_record=true`

  const formData = new FormData()
  formData.append('attachments_modified', 'true')
  formData.append('sysparm_table', table)
  formData.append('sysparm_sys_id', sysId)
  formData.append('sysparm_nostack', 'yes')

  const ck = window.g_ck || ''
  formData.append('sysparm_encryption_context', '')
  formData.append('sysparm_ck', ck)
  formData.append('sysparm_fieldname', fieldName)
  formData.append('attachFile', file)

  try {
    return await axios.post(url, formData).then(res => res.data.sys_id)
  } catch (error) {
    console.error('Error uploading image attachment:', error)
    return ''
  }
}
