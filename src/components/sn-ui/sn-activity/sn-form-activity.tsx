import { SnActivity } from '@kit/types/form-schema'
import { useFormLifecycle } from '@kit/components/sn-form/contexts/SnFormLifecycleContext'
import { SnActivityCard } from './sn-activity-card'
// import { Separator } from "@kit/components/ui/separator"

export function SnFormActivity({ activity }: { activity: SnActivity }) {
  console.log('SnFormActivity', activity)
  const { formConfig } = useFormLifecycle()
 
  return (
    <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto px-2">
      {activity.entries.map(entry => {
        const alignment = entry.user_sys_id === formConfig.user ? 'flex justify-end' : 'flex justify-start'
        return (
          <div key={entry.sys_id} className={alignment}>
            <div className="max-w-2xl w-full">
              {/* Entry content */}
              <SnActivityCard entry={entry} />
            </div>
          </div>
        )
      })}
    </div>
  )
}