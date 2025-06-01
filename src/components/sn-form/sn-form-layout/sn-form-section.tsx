import { ReactNode } from 'react'

type SectionColumn = {
  fields: {
    name: string
    type: string
  }[]
}

type SnSectionProps = {
  columns: SectionColumn[]
  bootstrapCells: number
  renderField: (name: string) => ReactNode
}

export function SnFormSection({ columns, bootstrapCells, renderField }: SnSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tailwindCols = ["grid-cols-1", "grid-cols-2"]
  const gridCols = Math.max(1, 12 / bootstrapCells)
  const gridClass = `grid grid-cols-1 md:grid-cols-${gridCols} gap-4`

  return (
    <div className={gridClass}>
      {columns.map((column, colIndex) => (
        <div key={colIndex} className="space-y-4">
          {column.fields.map(field => (
            <div key={field.name}>{renderField(field.name)}</div>
          ))}
        </div>
      ))}
    </div>
  )
}
