import axios from 'axios'
import { useEffect, useState } from 'react'
import { SnActivityEntry, SnJournalField } from '@kit/types/form-schema'
import { getJournalEntries, transformBaseToActivityEntry } from '@kit/utils/activity-api'
import { SnFormActivity } from './sn-form-activity'
import { Alert, AlertTitle, AlertDescription } from '@kit/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { SnActivitySkeleton } from './sn-activity-skeleton'

type ActivityProps = {
  table: string
  guid: string
  user: string
  fullWidth?: boolean
}

export function SnActivity({ table, guid, user, fullWidth = false }: ActivityProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<SnActivityEntry[]>([])
  const [journalFields, setJournalFields] = useState<SnJournalField[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const fetchActivity = async () => {
      setError(null)
      setLoading(true)

      try {
        const res = await getJournalEntries(table, guid, controller)

        if (!controller.signal.aborted) {
          if (!res) return setError('Failed to fetch activity data')

          const fields = res.fields || []
          if (!fields.length) setError('No journal fields found')

          const transformed = res.entries.filter(e => e.entries.journal.length).map(transformBaseToActivityEntry)
          setJournalFields(fields)
          setEntries(transformed)
        }
      } catch (e) {
        if (axios.isAxiosError(e) && e.code === 'ERR_CANCELED') return
        console.error('Error fetching activity data:', e)
        setError('Failed to load activity data')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchActivity()
    return () => controller.abort()
  }, [guid, table])

  return (
    <>
      {loading && (
        <div>
          <SnActivitySkeleton />
        </div>
      )}
      {!loading && error && (
        <Alert variant="destructive" className="max-w-4xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!loading && !error && (
        <SnFormActivity
          user={user}
          table={table}
          guid={guid}
          journalFields={journalFields}
          journalEntries={entries}
          fullWidth={fullWidth}
        />
      )}
    </>
  )
}
