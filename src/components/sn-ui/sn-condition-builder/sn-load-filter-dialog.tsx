import { toast } from 'sonner'
import { Input } from '@kit/components/ui/input'
import { Button } from '@kit/components/ui/button'
import { useEffect, useMemo, useState } from 'react'
import { CircleMinus, Filter, FolderOpen, LoaderCircle } from 'lucide-react'
import { deleteFilter, getSavedFilters } from '@kit/utils/conditions-api'
import { SnSavedFilter, SnSavedFiltersResponse } from '@kit/types/condition-schema'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/components/ui/tooltip'

type LoadFilterDialogProps = {
  table: string
  disabled?: boolean
  onLoad: (filter: SnSavedFilter) => void
}

function flattenFilters(grouped: SnSavedFiltersResponse): SnSavedFilter[] {
  return (['USER', 'GROUP', 'GLOBAL'] as const).flatMap(type => grouped[type] ?? [])
}

export function SnLoadFilterDialog({ table, disabled, onLoad }: LoadFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<SnSavedFilter[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setSearch('')
    setFilters([])
    setLoading(true)

    const controller = new AbortController()
    ;(async () => {
      const result = await getSavedFilters(table, controller, msg => toast.error(msg))
      if (result) setFilters(flattenFilters(result))
      setLoading(false)
    })()

    return () => controller.abort()
  }, [open, table])

  const visibleFilters = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return filters
    return filters.filter(f => f.title.toLowerCase().includes(term))
  }, [filters, search])

  const handleLoad = (filter: SnSavedFilter) => {
    onLoad(filter)
    setOpen(false)
  }

  const handleDelete = async (filter: SnSavedFilter) => {
    setDeletingId(filter.id)
    const ok = await deleteFilter(table, filter.id, msg => toast.error(msg))
    setDeletingId(null)
    if (ok) {
      setFilters(prev => prev.filter(f => f.id !== filter.id))
      toast.success('Filter deleted')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" disabled={disabled} aria-label="Load Filter">
              <FolderOpen />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Load Filter</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Filter</DialogTitle>
          <DialogDescription>Select a saved filter to apply the current conditions.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="h-4 w-4" />
            Search filters
          </div>
          <Input
            autoFocus
            value={search}
            placeholder="Search filters"
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-1 min-h-0 flex-col overflow-y-auto px-1 -mx-1">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <LoaderCircle className="animate-spin h-5 w-5" />
            </div>
          ) : visibleFilters.length ? (
            visibleFilters.map(filter => (
              <div
                key={filter.id}
                className="flex items-center justify-between gap-2 border-b py-2 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => handleLoad(filter)}
                  className="flex-1 truncate text-left text-sm text-primary hover:underline"
                  title={filter.title}
                >
                  {filter.title}
                </button>
                {filter.canDelete && (
                  <button
                    type="button"
                    aria-label={`Delete ${filter.title}`}
                    disabled={deletingId === filter.id}
                    onClick={() => handleDelete(filter)}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === filter.id ? (
                      <LoaderCircle className="animate-spin h-4 w-4" />
                    ) : (
                      <CircleMinus className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground italic">
              {search.trim() ? 'No filters match your search' : 'No saved filters'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
