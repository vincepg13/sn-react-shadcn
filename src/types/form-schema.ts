import { z } from 'zod'
import { SnRow } from './table-schema';
import { ControllerRenderProps } from "react-hook-form";

const _recordPickerItem = z.object({
    display_value: z.string(),
    value: z.string(),
    primary: z.string().optional(),
    secondary: z.string().optional(),
    meta: z.custom<SnRow>().optional()
})

const _formField = z.object({
    name: z.string(),
    label: z.string(),
    value: z.string(),
    displayValue: z.string(),
    mandatory: z.boolean(),
    visible: z.boolean(),
    readonly: z.boolean(),
    type: z.enum(['string', 'choice', 'date', 'reference', 'boolean']),
    max_length: z.number().optional(),
    choice: z.number().optional(),
    choices: z.array(z.object({
        label: z.string(),
        value: z.string()
    })).optional(),
})

export const pickerList = z.record(_recordPickerItem)

export type SnFieldSchema = z.infer<typeof _formField>
export type SnFieldsSchema = Record<string, SnFieldSchema>
export type SnRecordPickerItem = z.infer<typeof _recordPickerItem>
export type SnRecordPickerList = SnRecordPickerItem[]


export type FormData = Record<string, string | boolean | number | null>;
export type RHFField = ControllerRenderProps<FormData, string>;
