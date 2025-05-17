import { MinimalTiptapEditor } from "@kit/components/minimal-tiptap"
import { SnFieldBaseProps } from "@kit/types/form-schema"
import { Content } from "@tiptap/react"
import { useFieldUI } from "../contexts/FieldUIContext"

export function SnFieldHtml({rhfField, onChange}: SnFieldBaseProps<string>) {
  const { readonly } = useFieldUI()


  return (
    <MinimalTiptapEditor
      value={rhfField.value as Content}
      onChange={(e) => onChange(e as string)}
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