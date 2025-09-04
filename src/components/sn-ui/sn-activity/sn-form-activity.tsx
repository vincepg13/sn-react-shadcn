import { useEffect, useMemo, useState } from 'react'
import { SnActivityPost } from './sn-activity-post'
import { SnActivityRow } from './sn-activity-row'
import { useEffectiveFieldStates } from '@kit/components/sn-form/hooks/useFieldUiState'
import {
  EntryFields,
  FieldUIState,
  SnActivityEntry,
  SnFieldPrimitive,
  SnFieldSchema,
  SnJournalField,
} from '@kit/types/form-schema'

type SnActivityProps = {
  journalEntries: SnActivityEntry[]
  journalFields: SnJournalField[]
  user: string
  table: string
  guid: string
  fullWidth?: boolean
  fieldUIState?: Record<string, FieldUIState>
  journalInputs?: SnFieldSchema[]
  getValues?: (fieldName: string) => SnFieldPrimitive
  setValue?: (fieldName: string, value: SnFieldPrimitive) => void
}

export function SnFormActivity({
  journalEntries,
  journalFields,
  user,
  table,
  guid,
  fullWidth = false,
  fieldUIState,
  journalInputs,
  setValue,
  getValues,
}: SnActivityProps) {
  const [entryFields, setEntryFields] = useState<EntryFields[]>([])
  const [entries, setEntries] = useState<SnActivityEntry[]>(journalEntries || [])

  useEffect(() => {
    setEntries(journalEntries)
  }, [journalEntries])

  const effectiveFields = useMemo(() => {
    if (!journalInputs || !getValues) return []

    return journalInputs.map(field => ({
      field,
      fieldVal: String(getValues(field.name) ?? ''),
    }))
  }, [journalInputs, getValues])

  
  const fieldUiMap = useEffectiveFieldStates({
    fields: effectiveFields,
    uiState: fieldUIState || {},
  })

  const onEntryChange = (field: string, entry: string) => {
    if (setValue) setValue(field, entry)
  }

  const onPostSuccess = (newEntry: SnActivityEntry) => {
    setEntries(prev => [newEntry, ...prev])
  }

  useEffect(() => {
    if (!journalInputs || journalInputs.length === 0) {
      return setEntryFields(
        journalFields
          .filter(f => {
            if (f.isActive === false || f.isJournal === false) return false
            return f.canWrite || f.can_write
          })
          .map(f => ({
            name: f.name,
            label: f.label || f.name,
          }))
      )
    }

    const useable = journalFields
      .filter(f => !fieldUiMap[f.name]?.visible && !fieldUiMap[f.name]?.readonly)
      .map(f => {
        const journal = journalInputs.find(j => j.name === f.name)
        return journal ? { name: journal!.name, label: journal!.label || journal!.name } : null
      })
      .filter(f => f !== null)

    setEntryFields(useable)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalFields, journalInputs])

  return (
    <div className="flex flex-col gap-4">
      {!!entryFields.length && (
        <SnActivityPost
          table={table}
          guid={guid}
          entryFields={entryFields}
          onPost={onPostSuccess}
          onEntryChange={onEntryChange}
        />
      )}

      <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1">
        {entries.map(entry => (
          <div key={entry.sys_id} className="last:mb-4">
            <SnActivityRow user={user} entry={entry} journalFields={journalFields} fullWidth={fullWidth} />
          </div>
        ))}
      </div>
    </div>
  )
}
