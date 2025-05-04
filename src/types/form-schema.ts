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

const _action = z.object({
    action_name: z.string(),
    form_style: z.string(),
    is_button: z.boolean(),
    is_contextual: z.boolean(),
    is_link: z.boolean(),
    name: z.string(),
    primary: z.boolean(),
    sys_id: z.string()
})

const _clientScript = z.object({
    name: z.string(),
    type: z.enum(['onLoad', 'onChange', 'onSubmit']),
    script: z.string(),
    fieldName: z.string(),
    tableName: z.string(),
    sys_id: z.string()
})

const _formField = z.object({
    name: z.string(),
    label: z.string(),
    value: z.string(),
    displayValue: z.string(),
    mandatory: z.boolean(),
    visible: z.boolean(),
    readonly: z.boolean(),
    type: z.enum(['string', 'choice', 'glide_date', 'glide_date_time', 'reference', 'boolean']),
    max_length: z.number().optional(),
    choice: z.number().optional(),
    choices: z.array(z.object({
        label: z.string(),
        value: z.string()
    })).optional(),
})

export const pickerList = z.record(_recordPickerItem)
export type SnUiAction = z.infer<typeof _action>
export type SnFieldSchema = z.infer<typeof _formField>
export type SnClientScript = z.infer<typeof _clientScript>
export type SnFieldsSchema = Record<string, SnFieldSchema>
export type SnRecordPickerItem = z.infer<typeof _recordPickerItem>
export type SnRecordPickerList = SnRecordPickerItem[]


export type FormData = Record<string, string | boolean | number | null>;
export type RHFField = ControllerRenderProps<FormData, string>;
export type FieldUIState = {
    mandatory: boolean;
    visible: boolean;
    readonly: boolean;
}

export interface SnFieldBaseProps<T> {
  rhfField: RHFField;
  onChange: (val: T) => void;
  field: SnFieldSchema
}