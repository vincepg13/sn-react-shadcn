import { SnRow } from './table-schema';
import { z } from 'zod'

const _recordPickerItem = z.object({
    display_value: z.string(),
    value: z.string(),
    primary: z.string().optional(),
    secondary: z.string().optional(),
    meta: z.custom<SnRow>().optional()
})

export const pickerList = z.record(_recordPickerItem)
export type SnRecordPickerItem = z.infer<typeof _recordPickerItem>
export type SnRecordPickerList = SnRecordPickerItem[]