import { useState } from 'react';
import { Button } from '@kit/components/ui/button';
import { SnRecordPickerItem } from '@kit/types/form-schema';
import { SnRecordPicker } from '@kit/components/sn-form/sn-record-picker';

export type GroupMembersEditorProps = {
  members: SnRecordPickerItem[];
  isSaving?: boolean;
  onSave: (memberIds: string[]) => void | Promise<unknown>;
};

function normalizeMemberIds(members: SnRecordPickerItem[]) {
  return members.map(({ value }) => value).sort();
}

function memberIdsMatch(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function SnGroupMemberEditor({ members: initialMembers, isSaving = false, onSave }: GroupMembersEditorProps) {
  const [members, setMembers] = useState(initialMembers);
  const [savedMemberIds, setSavedMemberIds] = useState(() => normalizeMemberIds(initialMembers));
  const currentMemberIds = normalizeMemberIds(members);
  const hasChanges = !memberIdsMatch(currentMemberIds, savedMemberIds);

  const saveMembers = async () => {
    try {
      await onSave(currentMemberIds);
      setSavedMemberIds(currentMemberIds);
    } catch {
      // The consuming application is responsible for surfacing save failures.
    }
  };

  return (
    <div className="grid gap-6">
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
          onChange={(records) => setMembers(Array.isArray(records) ? records : records ? [records] : [])}
          placeholder="Search for users"
          searchType="CONTAINS"
        />
        <p className="text-sm text-muted-foreground">Add or remove active users, then save your changes.</p>
      </fieldset>

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!hasChanges || isSaving}
          onClick={() => void saveMembers()}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
