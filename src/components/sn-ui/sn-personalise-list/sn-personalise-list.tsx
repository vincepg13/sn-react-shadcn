import { CSS } from '@dnd-kit/utilities'
import { Settings2, Trash2 } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { SnListItem } from '@kit/types/table-schema'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { DialogDescription } from '@radix-ui/react-dialog'
import { CSSProperties, ReactNode, useMemo, useState } from 'react'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/components/ui/dialog'
import {
  useDraggable,
  DndContext,
  PointerSensor,
  DragEndEvent,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'

type SnPersonaliseListProps = {
  unselected: SnListItem[]
  selected: SnListItem[]
  isUserList: boolean
  onReset?: () => void
  onSave?: (selected: SnListItem[]) => void
}

export function SnPersonaliseList({ unselected, selected, isUserList, onReset, onSave }: SnPersonaliseListProps) {
  const [selectedItems, setSelectedItems] = useState<SnListItem[]>(selected)

  // keep a single view of all items for lookups (unchanged)
  const all = useMemo(() => [...selected, ...unselected], [selected, unselected])

  const availableItems = useMemo(() => {
    const sel = new Set(selectedItems.map(i => i.value))
    return all
      .filter(i => !sel.has(i.value))
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  }, [all, selectedItems])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const [activeId, setActiveId] = useState<string | null>(null)
  const activeItem = useMemo(() => (activeId ? (all.find(i => i.value === activeId) ?? null) : null), [activeId, all])

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  function onDragEnd(e: DragEndEvent) {
    const active = String(e.active.id)
    const over = e.over?.id ? String(e.over.id) : null
    setActiveId(null)

    if (!over) return

    const selIds = selectedItems.map(i => i.value)
    const activeInSelected = selIds.includes(active)

    // Reorder within Selected (sortable → sortable)
    if (activeInSelected && selIds.includes(over)) {
      const from = selIds.indexOf(active)
      const to = selIds.indexOf(over)
      if (from !== to) setSelectedItems(prev => arrayMove(prev, from, to))
      return
    }

    // Add from All → Selected (draggable → sortable/container)
    if (!activeInSelected) {
      const item = availableItems.find(i => i.value === active)
      if (!item) return

      // Dropped over a specific item in Selected → insert before that item
      if (selIds.includes(over)) {
        const insertAt = selIds.indexOf(over)
        setSelectedItems(prev => [...prev.slice(0, insertAt), item, ...prev.slice(insertAt)])
        return
      }

      // Dropped over the end sentinel only → append to end
      if (over === 'drop-selected-end') {
        setSelectedItems(prev => [...prev, item])
        return
      }

      // If over === 'drop-available' (or anything else) → do nothing
    }
  }

  const resetAll = () => {
    setSelectedItems(selected)
    onReset?.()
  }

  const saveAll = () => onSave?.(selectedItems)

  return (
    <Dialog onOpenChange={console.log}>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Settings2 />
            Personalise
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Personalize List Columns</DialogTitle>

            <DialogDescription className="text-muted-foreground text-sm">
              Here you can personalise your list layout. <br />
              Use drag and drop to add columns to the selected fields or to reorder them.
            </DialogDescription>
          </DialogHeader>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
            modifiers={[snapCenterToCursor]}
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Available (simple list of draggables) */}
              <DroppableBox id="drop-available" title="All fields">
                <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
                  {availableItems.map(item => (
                    <li key={item.value}>
                      <DraggableRow id={item.value} label={item.label} />
                    </li>
                  ))}
                </ul>
              </DroppableBox>

              {/* Selected (sortable + end sentinel drop target) */}
              <Panel title="Selected fields">
                <SortableContext items={selectedItems.map(i => i.value)} strategy={verticalListSortingStrategy}>
                  <ul className="flex max-h-80 flex-col gap-2 overflow-auto">
                    {selectedItems.map(item => (
                      <li key={item.value}>
                        <SortableRow
                          id={item.value}
                          label={item.label}
                          onRemove={() => setSelectedItems(prev => prev.filter(i => i.value !== item.value))}
                        />
                      </li>
                    ))}
                    {/* Append-only drop target BELOW the last item */}
                    <li>
                      <EndDropZone id="drop-selected-end" />
                    </li>
                  </ul>
                </SortableContext>
              </Panel>
            </div>

            <DragOverlay dropAnimation={null}>
              {activeItem ? (
                <div className="pointer-events-none z-[9999] cursor-grabbing select-none rounded-md border bg-background px-2 py-2 text-sm shadow">
                  {activeItem.label}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          <DialogFooter className="gap-2">
            {isUserList && (
              <Button variant="secondary" onClick={resetAll}>
                Reset to column defaults
              </Button>
            )}
            <Button onClick={saveAll}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

// Simple droppable panel (no ring) used for "All fields"
function DroppableBox({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className="rounded-xl border p-3">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  )
}

// Plain panel for Selected (no container droppable; we use a small end sentinel instead)
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
    </div>
  )
}

// Tiny drop zone that sits *below* the last item and only appends when hovered/dropped
function EndDropZone({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`h-8 rounded ${isOver ? 'bg-accent/30' : ''}`}
      aria-hidden
      title="Drop here to add to end"
    />
  )
}

// Sortable row with a trash button to remove
function SortableRow({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // HIDE the original while dragging so only the overlay is visible
    opacity: isDragging ? 0 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-[6.375px] text-sm"
    >
      <span className="cursor-grab select-none active:cursor-grabbing truncate">{label}</span>
      <Button
        size="icon"
        type="button"
        variant="ghost"
        onClick={onRemove}
        className="size-6 text-red-500 hover:bg-red-100 hover:text-red-600"
        aria-label={`Remove ${label}`}
      >
        <Trash2 size={10} />
      </Button>
    </div>
  )
}

function DraggableRow({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id })
  const style: CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    // HIDE while dragging; overlay handles the visual
    opacity: isDragging ? 0 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab select-none rounded-md border bg-background px-2 py-2 text-sm active:cursor-grabbing truncate"
    >
      {label}
    </div>
  )
}
