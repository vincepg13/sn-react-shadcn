import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@kit/components/ui/button'
import { SnListItem } from '@kit/types/table-schema'
import { snapCenterToCursor } from '@dnd-kit/modifiers'
import { DialogDescription } from '@radix-ui/react-dialog'
import { GripVertical, Settings2, Trash2 } from 'lucide-react'
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
  Children,
  CSSProperties,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
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
import { Spinner } from '@kit/components/minimal-tiptap/components/spinner'

type SnPersonaliseListProps = {
  unselected: SnListItem[]
  selected: SnListItem[]
  isUserList: boolean
  children?: ReactElement
  onSave: (selected?: SnListItem[]) => Promise<void>
}

export function SnPersonaliseList({ unselected, selected, isUserList, children, onSave }: SnPersonaliseListProps) {
  const [open, setOpen] = useState(false)
  const [saving, isSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<SnListItem[]>(selected)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  useEffect(() => setSelectedItems(selected), [selected])

  // keep a single view of all items for lookups (unchanged)
  const all = useMemo(() => [...selected, ...unselected], [selected, unselected])
  const activeItem = useMemo(() => (activeId ? (all.find(i => i.value === activeId) ?? null) : null), [activeId, all])
  const availableItems = useMemo(() => {
    const sel = new Set(selectedItems.map(i => i.value))
    return all
      .filter(i => !sel.has(i.value))
      .slice()
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  }, [all, selectedItems])

  // Handle Save/Reset
  const handleSave = useCallback(
    async (items?: SnListItem[]) => {
      try {
        isSaving(true)
        await onSave(items)
        setOpen(false)
      } catch (e) {
        if (isAxiosError(e) && e.code === 'ERR_CANCELED') return
        toast.error('Error saving personal list: ' + e)
      } finally {
        isSaving(false)
      }
    },
    [onSave]
  )

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

    // Reorder within Selected
    if (activeInSelected && selIds.includes(over)) {
      const from = selIds.indexOf(active)
      const to = selIds.indexOf(over)
      if (from !== to) setSelectedItems(prev => arrayMove(prev, from, to))
      return
    }

    if (activeInSelected && over === 'drop-selected-end') {
      const from = selIds.indexOf(active)
      if (from !== -1 && from !== selectedItems.length - 1) {
        setSelectedItems(prev => arrayMove(prev, from, prev.length - 1))
      }
      return
    }

    // Add from All → Selected
    if (!activeInSelected) {
      const item = availableItems.find(i => i.value === active)
      if (!item) return

      // Dropped over a specific item in Selected, insert before that item
      if (selIds.includes(over)) {
        const insertAt = selIds.indexOf(over)
        setSelectedItems(prev => [...prev.slice(0, insertAt), item, ...prev.slice(insertAt)])
        return
      }

      // Dropped over the end sentinel only, append to end
      if (over === 'drop-selected-end') {
        setSelectedItems(prev => [...prev, item])
        return
      }
    }
  }

  let triggerEl: ReactElement | null = null
  if (children != null) {
    const only = Children.only(children) // will throw in dev if multiple
    if (isValidElement(only)) {
      triggerEl = only as ReactElement
    } else {
      console.warn(
        '[SnPersonaliseList] Child passed to component is not a valid React element. Falling back to default trigger.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          {triggerEl ?? (
            <Button variant="outline">
              <Settings2 />
              Personalise
            </Button>
          )}
        </DialogTrigger>

        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Personalise List Columns</DialogTitle>

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

          <DialogFooter className="gap-2 items-center">
            {saving && <Spinner className="size-6" />}
            {isUserList && (
              <Button variant="secondary" onClick={() => handleSave()}>
                Reset to column defaults
              </Button>
            )}
            <Button onClick={() => handleSave(selectedItems)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}

// Simple droppable panel used for "All fields"
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
    opacity: isDragging ? 0 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center gap-2 rounded-md border bg-background px-2 py-[6.375px] text-sm"
    >
      <GripVertical className="size-4 text-muted-foreground" />
      <span className="cursor-grab select-none active:cursor-grabbing truncate flex-1">{label}</span>
      <Button
        size="icon"
        type="button"
        variant="ghost"
        onClick={onRemove}
        className="size-6 text-red-500 hover:bg-red-100 hover:text-red-600 ml-auto"
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
