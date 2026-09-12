import { toast } from 'sonner'
import { Input } from '@kit/components/ui/input'
import { Label } from '@kit/components/ui/label'
import { Button } from '@kit/components/ui/button'
import { BookmarkPlus, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { mergeOrItems, getParsedQuery, saveFilter } from '@kit/utils/conditions-api'
import { SnRecordPicker } from '@kit/components/sn-form/sn-record-picker'
import { RadioGroup, RadioGroupItem } from '@kit/components/ui/radio-group'
import { SnConditionDisplayArray, SnSavedFilter, SnSavedFilterVisibility } from '@kit/types/condition-schema'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@kit/components/ui/tooltip'
import { SnRecordPickerItem } from '@kit/types/form-schema'

type SaveFilterDialogProps = {
  table: string
  query: string
  disabled?: boolean
  onSaved?: (filter: SnSavedFilter) => void
}

function buildQueryPreview(display: SnConditionDisplayArray | null): string {
  if (!display || !display.length) return ''
  return mergeOrItems(display)
    .map(group => group.map(item => item.display).join(' AND '))
    .join(' OR ')
}

export function SnSaveFilterDialog({ table, query, disabled, onSaved }: SaveFilterDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [visibility, setVisibility] = useState<SnSavedFilterVisibility>('USER')
  const [group, setGroup] = useState<SnRecordPickerItem | null>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)

  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState('')

  useEffect(() => {
    if (!open) return

    setTitle('')
    setVisibility('USER')
    setGroup(null)

    const controller = new AbortController()
    setPreviewLoading(true)
    setPreview(query)
    ;(async () => {
      const result = await getParsedQuery(table, query, true, controller)
      if (result) setPreview(buildQueryPreview(result.display ?? null) || query)
      setPreviewLoading(false)
    })()

    return () => controller.abort()
  }, [open, table, query])

  const groupInvalid = visibility === 'GROUP' && !group
  const canSubmit = useMemo(() => !!title.trim() && !groupInvalid && !!query, [title, groupInvalid, query])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)

    const setError = (msg: string) => toast.error(msg)
    const result = await saveFilter(
      table,
      {
        tableName: table,
        title: title.trim(),
        filter: query,
        saveType: visibility,
        ...(visibility === 'GROUP' && group ? { group: group.value } : {}),
      },
      setError
    )

    setSaving(false)
    if (result) {
      toast.success('Filter saved')
      onSaved?.(typeof result === 'object' ? result : ({ id: '', title: title.trim(), filter: query, tableName: table, saveType: visibility } as SnSavedFilter))
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" disabled={disabled} aria-label="Save Filter">
              <BookmarkPlus />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Save Filter</TooltipContent>
      </Tooltip>
      <DialogContent ref={setContainer} className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Save Filter</DialogTitle>
          <DialogDescription>Save the current conditions so they can be reused later.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-1 -mx-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sn-save-filter-title">
              Filter name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sn-save-filter-title"
              value={title}
              autoFocus
              placeholder="Enter a filter name"
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Query</Label>
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground min-h-9 flex items-center">
              {previewLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : (
                preview || <span className="italic">No conditions set</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={v => setVisibility(v as SnSavedFilterVisibility)}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="USER" id="sn-save-filter-user" />
                <Label htmlFor="sn-save-filter-user" className="font-normal">
                  Only Me
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="GLOBAL" id="sn-save-filter-global" />
                <Label htmlFor="sn-save-filter-global" className="font-normal">
                  Everyone
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="GROUP" id="sn-save-filter-group" />
                <Label htmlFor="sn-save-filter-group" className="font-normal">
                  Group
                </Label>
              </div>
            </RadioGroup>

            {visibility === 'GROUP' && (
              <SnRecordPicker
                portalContainer={container}
                table="sys_user_group"
                fields={['name']}
                query="sys_idINjavascript:gs.getUser().getMyGroups()"
                value={group}
                onChange={record => setGroup(record as SnRecordPickerItem)}
                placeholder="-- Select a Group --"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!canSubmit || saving}>
            {saving && <LoaderCircle className="animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
