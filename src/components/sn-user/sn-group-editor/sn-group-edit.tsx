import { useState } from 'react'
import { Button } from '@kit/components/ui/button'
import { SnRecordPickerItem } from '@kit/types/form-schema'
import { SnRecordPicker } from '@kit/components/sn-form/sn-record-picker'
import { SnGroupEditable } from './sn-manage-groups'

export type GroupMembersEditorProps = {
  members: SnRecordPickerItem[]
  isSaving?: boolean
  manager?: SnRecordPickerItem
  onSave: (memberIds: string[], grp?: SnGroupEditable) => void | Promise<unknown>
}

function normalizeMemberIds(members: SnRecordPickerItem[]) {
  return members.map(({ value }) => value).sort()
}

function memberIdsMatch(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

export function SnGroupMemberEditor({
  members: initialMembers,
  isSaving = false,
  manager,
  onSave,
}: GroupMembersEditorProps) {
  const [members, setMembers] = useState(initialMembers)
  const [selectedManager, setSelectedManager] = useState(manager)
  const [savedMemberIds, setSavedMemberIds] = useState(() => normalizeMemberIds(initialMembers))
  const [savedManagerId, setSavedManagerId] = useState(manager?.value)
  const currentMemberIds = normalizeMemberIds(members)
  const hasManagerChanges = selectedManager?.value !== savedManagerId
  const hasChanges = !memberIdsMatch(currentMemberIds, savedMemberIds) || hasManagerChanges

  const saveMembers = async () => {
    try {
      await onSave(currentMemberIds, selectedManager ? { manager: selectedManager.value } : undefined)
      setSavedMemberIds(currentMemberIds)
      setSavedManagerId(selectedManager?.value)
    } catch {
      // The consuming application is responsible for surfacing save failures.
    }
  }

  return (
    <div className="grid gap-6">
      {manager && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Manager</legend>
          <SnRecordPicker
            table="sys_user"
            fields={['name', 'user_name', 'email']}
            query="active=true"
            value={selectedManager}
            editable={!isSaving}
            closeOnSelectMultiple={false}
            onChange={record => {
              setSelectedManager(Array.isArray(record) ? (record[0] ?? undefined) : (record ?? undefined))
            }}
            placeholder="Search for users"
            searchType="CONTAINS"
          />
          <p className="text-sm text-muted-foreground">Select a manager for the group.</p>
        </fieldset>
      )}
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Members</legend>
        <SnRecordPicker
          table="sys_user"
          fields={['name', 'user_name', 'email']}
          query="active=true"
          value={members}
          multiple
          editable={!isSaving}
          closeOnSelectMultiple={false}
          onChange={records => setMembers(Array.isArray(records) ? records : records ? [records] : [])}
          placeholder="Search for users"
          searchType="CONTAINS"
        />
        <p className="text-sm text-muted-foreground">Add or remove active users, then save your changes.</p>
      </fieldset>
      <div className="flex justify-end">
        <Button type="button" disabled={!hasChanges || isSaving} onClick={() => void saveMembers()}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
