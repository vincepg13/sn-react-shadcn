import { SnRecordPicker } from '@kit/components/sn-form/sn-record-picker'
import { SnConditionField } from '@kit/types/condition-schema'
import { SnRecordPickerItem } from '@kit/types/form-schema'
import { useEffect, useState } from 'react'

type RefProps = {
  value: string
  field: SnConditionField
  display_value: string
  table: string
  onChange: (value: string, display_value: string) => void
}

export function SnValueReference({ value, field, display_value, table, onChange }: RefProps) {
  const displayField = field.referenceDisplayField!
  const [refData, setRefData] = useState<SnRecordPickerItem | null>(value ? { value, display_value } : null)

  useEffect(() => {
    if (!value) setRefData(null)
  }, [value])

  const handleChange = (record: SnRecordPickerItem) => {
    setRefData(record)
    onChange(record?.value || '', record?.display_value || '')
  }

  const displayFields = field.referenceCols ? [displayField, ...field.referenceCols] : [displayField]

  return (
    <SnRecordPicker
      table={table}
      fields={displayFields}
      value={refData}
      onChange={record => handleChange(record as SnRecordPickerItem)}
      placeholder="-- Empty --"
    ></SnRecordPicker>
  )
}
