import { useEffect, useRef } from 'react'
import { deleteAttachment, uploadFieldAttachment } from '@kit/utils/attachment-api'

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
  table: string
  extension: string
  attachmentGuid: string
  onChange: (val: string) => void
  setOrigValue: (val: string) => void
  registerPreUiActionCallback: (fieldName: string, cb: () => Promise<void>) => void
  clearLocalFile: () => void
}) {
  const ld = useRef<LifecycleData>({ file, fieldVal, origValue })

  function updateMediaValues(val: string) {
    onChange(val)
    setOrigValue(val)
    field.displayValue = val ? `${val}${extension}` : ''
  }

  useEffect(() => {
    ld.current = { file, fieldVal, origValue }
  }, [file, fieldVal, origValue])

  useEffect(() => {
    registerPreUiActionCallback(field.name, async () => {
      const l = ld.current

      if (l.origValue && !l.file && !l.fieldVal) {
        const res = await deleteAttachment(l.origValue)
        if (res) updateMediaValues('')
        return
      }

      if (!l.file) return

      if (l.origValue && l.origValue !== l.fieldVal) {
        await deleteAttachment(l.origValue)
      }

      const upload = await uploadFieldAttachment(l.file, table, attachmentGuid, field.name)
      if (upload?.sys_id) {
        updateMediaValues(upload.sys_id)
        clearLocalFile()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.name, fieldVal])
}
