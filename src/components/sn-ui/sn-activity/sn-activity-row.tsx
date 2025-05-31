import { SnActivityEntry, SnJournalField } from '@kit/types/form-schema'
import { SnActivityCard } from './sn-activity-card'
import SnAvatar from '@kit/components/sn-user/sn-avatar'

export function SnActivityRow({
  user,
  entry,
  journalFields,
}: {
  user: string
  entry: SnActivityEntry
  journalFields: SnJournalField[]
}) {
  const colour = journalFields.find(f => f.name === entry.element)?.color
  return (
    <div key={entry.sys_id} className="grid grid-cols-[40px_1fr] lg:grid-cols-[1fr_40px_1fr] gap-2">
      <div className="col-start-1 lg:col-start-2 row-start-1 flex items-center justify-center">
        <SnAvatar name={entry.name} initials={entry.initials} image={entry.user_img} className="size-9" />
      </div>
      <div
        className={
          (entry.user_sys_id === user ? 'col-start-2 lg:col-start-3' : 'col-start-2 lg:col-start-1') + ' row-start-1'
        }
      >
        <SnActivityCard entry={entry} colour={colour} />
      </div>
    </div>
  )
}
