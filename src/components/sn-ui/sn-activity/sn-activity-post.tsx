import { toast } from 'sonner'
import { useEffect, useRef, useState } from 'react'
import { Textarea } from '@kit/components/ui/textarea'
import { Button } from '@kit/components/ui/button'
import { EntryFields, SnActivityEntry } from '@kit/types/form-schema'
import { postJournalEntry } from '@kit/utils/activity-api'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@kit/components/ui/select'
import { LoaderCircle } from 'lucide-react'

type PostProps = {
  table: string
  guid: string
  entryFields: EntryFields[]
  inputType?: 'inline' | 'textarea'
  onPost?: (entry: SnActivityEntry) => void
  onEntryChange?: (field: string, entry: string) => void
}

export function SnActivityPost({
  table,
  guid,
  entryFields,
  inputType = 'inline',
  onPost,
  onEntryChange,
}: PostProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const [isPosting, setIsPosting] = useState(false)
  const [journalField, setJournalField] = useState(() => entryFields[0]?.name ?? '')

  const handlePost = async () => {
    if (isPosting || !journalField) return

    const value = inputRef.current?.value ?? ''
    if (!value) return

    try {
      setIsPosting(true)
      const res = await postJournalEntry(table, guid, journalField, value, controllerRef.current!)
      if (!res) return toast.error(`Post Failed`)

      onPost?.(res as SnActivityEntry)
      onEntryChange?.(journalField, '')
      if (inputRef.current) inputRef.current.value = ''
    } catch (error) {
      console.error('Error posting journal entry:', error)
      toast.error(`Failed to post ${journalField} entry. Please try again.`)
    } finally {
      setIsPosting(false)
    }
  }

  const journalFieldChange = (value: string) => {
    setJournalField(value)
    entryFields.forEach(field => onEntryChange?.(field.name, ''))
    onEntryChange?.(value, inputRef.current?.value ?? '')
  }

  useEffect(() => {
    controllerRef.current = new AbortController()
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  const isTextarea = inputType === 'textarea'

  return (
    <div className={isTextarea ? 'flex w-full flex-col gap-2' : 'flex w-full items-center'}>
      <Textarea
        placeholder="Type your message here..."
        ref={inputRef}
        rows={isTextarea ? 3 : 1}
        onBlur={e => onEntryChange?.(journalField, e.target.value)}
        className={
          isTextarea
            ? 'h-20 min-h-20 max-h-20 resize-none overflow-y-auto'
            : 'h-9 min-h-9 max-h-9 min-w-0 flex-1 resize-none overflow-y-auto rounded-r-none py-1'
        }
      />
      <div className={isTextarea ? 'flex justify-end' : 'flex shrink-0 items-center'}>
        <Select value={journalField} onValueChange={journalFieldChange}>
          <SelectTrigger
            className={
              isTextarea
                ? 'border-r-0 rounded-r-none'
                : 'border-l-0 border-r-0 rounded-l-none rounded-r-none'
            }
          >
            <SelectValue placeholder="Select Input">{entryFields.find(f => f.name === journalField)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Inputs</SelectLabel>
              {entryFields.map(field => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button type="button" onClick={handlePost} className="min-w-[100px] rounded-l-none" disabled={isPosting}>
          {isPosting && <LoaderCircle className="animate-spin" />}
          <span>Post</span>
        </Button>
      </div>
    </div>
  )
}
