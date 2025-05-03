import { useState } from 'react'
import { SnGroupCard } from './sn-group-card'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { AlertCircle } from 'lucide-react'
import { useSnGroup } from './hooks/useSnGroup'
import { useGroupMembers } from './hooks/useGroupMembers'
import { SnRow } from '../../types/table-schema'

interface SnGroupWrapperProps {
  guid: string
  pageSize?: number
  getImLink?: (row: SnRow, key: string) => string
}

export function SnGroupWrapper({ guid, pageSize = 10, getImLink }: SnGroupWrapperProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const { group, error } = useSnGroup(guid, getImLink)
  const { members, total } = useGroupMembers(guid, currentPage, pageSize, getImLink)

  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!error && group && (
        <SnGroupCard
          {...group}
          members={members}
          totalMembers={total}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  )
}
