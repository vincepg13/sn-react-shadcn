import { cn } from '@kit/lib/utils'
import { SnGroupMemberEditor } from './sn-group-edit'
import { Skeleton } from '@kit/components/ui/skeleton'
import { SnRecordPickerItem } from '@kit/types/form-schema'
import { SnRecordPicker } from '@kit/components/sn-form/sn-record-picker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/components/ui/card'

export type SnGroupEditable = {
  manager: string
}

export type SnGroupEditorProps = {
  groupQuery: string
  groupDescription?: string
  group: SnRecordPickerItem | null
  members: SnRecordPickerItem[]
  className?: string
  selectedGroupId?: string
  canEditManager?: boolean
  isGroupLoading?: boolean
  isSavingMembers?: boolean
  onGroupChange: (group: SnRecordPickerItem | null) => void
  onSaveMembers: (memberIds: string[], grp?: SnGroupEditable) => void | Promise<unknown>
}

export function SnGroupEditor({
  group,
  members,
  groupQuery,
  groupDescription,
  className,
  selectedGroupId,
  canEditManager = false,
  isGroupLoading = false,
  isSavingMembers = false,
  onGroupChange,
  onSaveMembers,
}: SnGroupEditorProps) {
  const selectGroup = (record: SnRecordPickerItem | SnRecordPickerItem[] | null) =>
    onGroupChange(Array.isArray(record) ? (record[0] ?? null) : record)

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="border-b">
        <CardTitle className="text-3xl">Manage Groups</CardTitle>
        <CardDescription>Select an eligible group and update its members.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Group</legend>
          <SnRecordPicker
            table="sys_user_group"
            fields={['name']}
            metaFields={['name', 'manager', 'email', 'description', 'type']}
            query={groupQuery}
            value={group}
            onChange={selectGroup}
            placeholder={selectedGroupId && isGroupLoading ? 'Loading selected group...' : 'Select a group'}
            searchType="CONTAINS"
          />
          {groupDescription ? <p className="text-sm text-muted-foreground">{groupDescription}</p> : null}
        </fieldset>

        {!selectedGroupId ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Select a group to view and edit its members.
          </div>
        ) : isGroupLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="ml-auto h-9 w-32" />
          </div>
        ) : group ? (
          <SnGroupMemberEditor
            key={selectedGroupId}
            members={members}
            isSaving={isSavingMembers}
            manager={canEditManager ? group!.meta!.manager ?? null : undefined}
            onSave={onSaveMembers}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
