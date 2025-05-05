const choicePredicates = [
  'IN',
  'NOT IN',
  'LIKE',
  'NOT LIKE',
  'STARTSWITH',
  'ENDSWITH'
] as const

const stringPredicates = [
  'STARTSWITH',
  'ENDSWITH',
  'LIKE',
  'NOT LIKE',
  '=',
  '!=',
  'ISEMPTY',
  'ISNOTEMPTY',
  'MATCH_PAT',
  'MATCH_RGX',
  'ANYTHING',
  'IN',
  'EMPTYSTRING',
  '<=',
  '>=',
  'BETWEEN',
  'SAMEAS',
  'NSAMEAS'
] as const

export const predicateMap: Record<string, readonly string[]> = {
  choice: choicePredicates,
  string: stringPredicates,
}

export function getAllPredicates(): string[] {
  return Array.from(new Set([...choicePredicates, ...stringPredicates]))
}
