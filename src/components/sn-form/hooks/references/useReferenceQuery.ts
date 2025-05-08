import { buildReferenceQuery } from '../../../../utils/form-api'

export function useReferenceQuery({
  columns,
  term,
  operator,
  orderBy,
  excludeValues = [],
}: {
  columns: string[]
  term: string
  operator?: string
  orderBy?: string[]
  excludeValues?: string[]
}): string {
  return buildReferenceQuery({
    columns,
    term,
    operator: operator || 'LIKE',
    orderBy,
    excludeValues,
  })
}
