import { format, toZonedTime } from 'date-fns-tz'
import { getAxiosInstance } from './axios-client'
import { SnBaseEntry, SnActivityEntry, SnBaseActivity } from '@kit/types/form-schema'

export async function getJournalEntries(
  table: string,
  guid: string,
  controller: AbortController | AbortSignal
): Promise<SnBaseActivity | false> {
  const axios = getAxiosInstance()
  try {
    const response = await axios.get(
      `/angular.do?sysparm_type=list_history&action=get_new_entries&table=${table}&sys_id=${guid}&sysparm_source=from_form`,
      { signal: controller instanceof AbortController ? controller.signal : controller }
    )

    if (response.status === 200) {
      if (!response.data) return false
      return response.data as SnBaseActivity
    }

    return false
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return false
  }
}

export async function postJournalEntry(
  table: string,
  guid: string,
  field: string,
  entry: string,
  controller: AbortController | AbortSignal
): Promise<boolean | SnActivityEntry> {
  const axios = getAxiosInstance()
  try {
    const post = await axios.post(
      `/angular.do?sysparm_type=list_history&action=insert&table=${table}&sys_id=${guid}&sysparm_source=from_form`,
      { entries: [{ field, text: entry }] },
      { signal: controller instanceof AbortController ? controller.signal : controller }
    )

    if (post.status === 200) {
      const lastEntry = post.data.entries[0] as SnBaseEntry
      if (lastEntry) {
        return transformBaseToActivityEntry(lastEntry)
      }
    }

    return false
  } catch (error) {
    console.error('Error posting journal entry:', error)
    return false
  }
}

export function transformBaseToActivityEntry(entry: SnBaseEntry): SnActivityEntry {
  const journal = entry.entries.journal[0]
  const utcDate = new Date(entry.sys_created_on) // ServiceNow format is parseable by Date
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localDate = toZonedTime(utcDate, timeZone)
  const formatted = format(localDate, 'dd/MM/yyyy HH:mm:ss', { timeZone })

  return {
    sys_created_on_adjusted: formatted,
    sys_id: journal.sys_id??"",
    login_name: entry.sys_created_by,
    user_sys_id: entry.user_id,
    initials: entry.initials,
    sys_created_on: entry.sys_created_on,
    contains_code: journal.contains_code,
    field_label: journal.field_label,
    is_truncated: journal.is_truncated,
    name: entry.sys_created_by,
    value: journal.sanitized_new_value || journal.new_value,
    element: journal.field_name,
    user_img: entry.user_image ? `/${entry.user_image}` : undefined,
  }
}
