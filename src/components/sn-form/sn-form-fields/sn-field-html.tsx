import { MinimalTiptapEditor } from '@kit/components/minimal-tiptap'
import { SnFieldBaseProps } from '@kit/types/form-schema'
import { Content } from '@tiptap/react'
import { useFieldUI } from '../contexts/FieldUIContext'
import DOMPurify from 'dompurify'

export function SnFieldHtml({ rhfField, onChange }: SnFieldBaseProps<string>) {
  const { readonly } = useFieldUI()

  if (readonly) {
    const sanitizedHtml = DOMPurify.sanitize(rhfField.value as string)
    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
  }

  return (
    <MinimalTiptapEditor
      value={rhfField.value as Content}
      onBlur={e => onChange(e as string)}
      className="w-full"
      editorContentClassName="p-5"
      output="html"
      placeholder="Enter your description..."
      autofocus={true}
      editable={!readonly}
      editorClassName="focus:outline-hidden"
    />
  )
}
