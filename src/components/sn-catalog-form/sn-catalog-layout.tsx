import type { ReactNode } from 'react'
import type {
  SnCatalogLayoutColumn,
  SnCatalogLayoutNode,
  SnCatalogSectionSchema,
} from '@kit/types/catalog-schema'
import { cn } from '@kit/lib/utils'

type SnCatalogLayoutProps = {
  sections: SnCatalogSectionSchema[]
  renderVariable: (name: string) => ReactNode
}

function columnClassName(columnCount: number) {
  if (columnCount >= 3) return 'md:grid-cols-3'
  if (columnCount === 2) return 'md:grid-cols-2'
  return 'grid-cols-1'
}

function CatalogColumns({
  columns,
  renderVariable,
  path,
}: {
  columns: SnCatalogLayoutColumn[]
  renderVariable: (name: string) => ReactNode
  path: string
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-x-6', columnClassName(columns.length))}>
      {columns.map((column, columnIndex) => (
        <div key={`${path}-column-${columnIndex}`}>
          {(column.fields || []).map((node, nodeIndex) => (
            <CatalogNode
              key={`${path}-column-${columnIndex}-node-${node.name || nodeIndex}`}
              node={node}
              renderVariable={renderVariable}
              path={`${path}-${columnIndex}-${nodeIndex}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function CatalogNode({
  node,
  renderVariable,
  path,
}: {
  node: SnCatalogLayoutNode
  renderVariable: (name: string) => ReactNode
  path: string
}) {
  if (node.visible === false) return null
  if (node.type === 'field') return node.name ? <>{renderVariable(node.name)}</> : null

  const nestedNodes = node.containers?.length ? node.containers : node.variables

  if (node.type === 'checkbox_container') {
    return (
      <div className="rounded-md border bg-muted/20 px-4 pt-2 mb-4">
        {node.caption && <div className="mb-2 text-sm font-medium">{node.caption}</div>}
        {nestedNodes?.map((nested, index) => (
          <CatalogNode
            key={`${path}-checkbox-${nested.name || index}`}
            node={nested}
            renderVariable={renderVariable}
            path={`${path}-checkbox-${index}`}
          />
        ))}
      </div>
    )
  }

  if (node.columns?.length) {
    return <CatalogColumns columns={node.columns} renderVariable={renderVariable} path={path} />
  }

  if (nestedNodes?.length) {
    return (
      <>
        {nestedNodes.map((nested, index) => (
          <CatalogNode
            key={`${path}-nested-${nested.name || index}`}
            node={nested}
            renderVariable={renderVariable}
            path={`${path}-nested-${index}`}
          />
        ))}
      </>
    )
  }

  return null
}

export function SnCatalogLayout({ sections, renderVariable }: SnCatalogLayoutProps) {
  return (
    <div className="space-y-5">
      {sections
        .filter(section => section.visible !== false)
        .map((section, index) => (
          <section key={section.id || section.name || `catalog-section-${index}`}>
            {section.caption && <h3 className="mb-3 text-base font-semibold">{section.caption}</h3>}
            <CatalogColumns
              columns={section.columns || []}
              renderVariable={renderVariable}
              path={section.id || section.name || `catalog-section-${index}`}
            />
          </section>
        ))}
    </div>
  )
}
