import { SnRecordPicker } from '@kit/components/sn-form/sn-record-picker'
import { SnRecordPickerItem } from '@kit/types/form-schema'
import { useEffect, useState } from 'react'

type RefProps = {
  value: string
  display_value: string
  table: string
  displayField: string
  onChange: (value: string, display_value: string) => void
}

export function SnValueReference({ value, display_value, table, displayField, onChange }: RefProps) {
  const [refData, setRefData] = useState<SnRecordPickerItem | null>(value ? { value, display_value } : null)

  useEffect(() => {
    if (!value) setRefData(null)
  }, [value])

  const handleChange = (record: SnRecordPickerItem) => {
    setRefData(record)
    onChange(record?.value || '', record?.display_value || '')
  }

  return (
    <SnRecordPicker
      table={table}
      fields={[displayField]}
      value={refData}
      onChange={record => handleChange(record as SnRecordPickerItem)}
      placeholder="Select a user"
    ></SnRecordPicker>
  )
}
