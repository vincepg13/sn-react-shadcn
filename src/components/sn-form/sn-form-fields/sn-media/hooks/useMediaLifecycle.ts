import { useEffect, useRef } from 'react'
import { deleteAttachment, uploadFieldAttachment } from '@kit/utils/attachment-api'
import { errorHandler } from '@kit/lib/utils'

type LifecycleData = {
  file: File | null
  fieldVal: string
  origValue: string
}

export function useMediaLifecycle({
  field,
  file,
  fieldVal,
  origValue,
  displayValue,
  table,
  extension,
  attachmentGuid,
  onChange,
  setOrigValue,
  registerPreUiActionCallback,
  clearLocalFile,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: { name: string; displayValue?: string; staged_data?: Record<string, any> }
  file: File | null
  fieldVal: string
  origValue: string
  displayValue?: string
  table: string
  extension: string
  attachmentGuid: string
  onChange: (val: string, displayValue?: string) => void
  setOrigValue: (val: string) => void
  registerPreUiActionCallback: (fieldName: string, cb: () => Promise<void>) => void
  clearLocalFile: () => void
}) {
  const ld = useRef<LifecycleData>({ file, fieldVal, origValue })

  function updateMediaValues(val: string, nextDisplayValue?: string) {
    onChange(val, nextDisplayValue)
    setOrigValue(val)
    if (!val) {
      field.displayValue = ''
      return
    }

    field.displayValue = nextDisplayValue ?? `${val}${extension}`
  }

  useEffect(() => {
    ld.current = { file, fieldVal, origValue }
  }, [file, fieldVal, origValue])

  useEffect(() => {
    registerPreUiActionCallback(field.name, async () => {
      const l = ld.current

      if (l.origValue && !l.file && !l.fieldVal) {
        try {
          await deleteAttachment(l.origValue)
          updateMediaValues('')
        } catch (error) {
          errorHandler(error, 'Failed to delete media attachment')
        }
        return
      }

      if (!l.file) return

      if (l.origValue && l.origValue !== l.fieldVal) {
        try {
          await deleteAttachment(l.origValue)
        } catch (error) {
          errorHandler(error, 'Failed to delete previous media attachment')
        }
      }

      try {
        const upload = await uploadFieldAttachment(l.file, table, attachmentGuid, field.name)
        if (upload?.sys_id) {
          updateMediaValues(upload.sys_id, displayValue || upload.file_name)
          clearLocalFile()
        }
      } catch (error) {
        errorHandler(error, 'Failed to upload media attachment')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.name, fieldVal, displayValue])
}
