import { Input } from '@kit/components/ui/input'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useFieldUI } from '../../contexts/FieldUIContext'
import { Trash } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { useFormLifecycle } from '../../contexts/SnFormLifecycleContext'
import { useMediaPreview } from './hooks/useMediaPreview'
import { useMediaLifecycle } from './hooks/useMediaLifecycle'

interface SnFieldMediaProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  extension: string
  table: string
  attachmentGuid: string
  onChange: (value: string) => void
}

export function SnFieldMedia({ field, rhfField, onChange, table, extension, attachmentGuid }: SnFieldMediaProps) {
  const fieldVal = String(rhfField.value ?? '')
  const snFixedValue = field.displayValue?.replace(extension, '') ?? ''
  const { readonly } = useFieldUI()
  const { formConfig, registerPreUiActionCallback } = useFormLifecycle()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [origValue, setOrigValue] = useState<string>(snFixedValue)

  const {
    file,
    setFile,
    source,
    setSource,
  } = useMediaPreview(field.staged_data?.file || null, fileInputRef)

  const previewUrl = source || field.staged_data?.preview || getFullSrcPath(formConfig.base_url, fieldVal)

  useMediaLifecycle({
    field,
    file,
    fieldVal,
    origValue,
    table,
    extension,
    attachmentGuid,
    onChange,
    setOrigValue,
    clearLocalFile,
    registerPreUiActionCallback,
  })

  useEffect(() => {
  if (extension === '.vvx' && videoRef.current) {
    videoRef.current.load()
  }
}, [previewUrl, extension])

  const accept = extension === '.iix' ? 'image/*' : extension === '.vvx' ? 'video/*' : ''

  function getFullSrcPath(baseUrl: string, snValue: string) {
    if (!snValue) return ''
    if (extension === '.vvx') {
      const guid = snValue.replace(extension, '')
      return `${baseUrl}/sys_attachment.do?sys_id=${guid}`
    }
    if (snValue.endsWith(extension)) return `${baseUrl}${snValue}`
    return `${baseUrl}${snValue}${extension}`
  }

  function clearLocalFile() {
    setFile(null)
    setSource(null)
    field.staged_data = {}
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function removeFile() {
    if (source?.startsWith('blob:')) URL.revokeObjectURL(source)
    clearLocalFile()
    onChange('')
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile)
      setFile(selectedFile)
      setSource(previewUrl)
      onChange(selectedFile.name.substring(0, 40))

      field.staged_data = {
        file: selectedFile,
        preview: previewUrl,
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!readonly && (
        <div className="flex gap-2">
          <Input type="file" accept={accept} ref={fileInputRef} onChange={handleFileChange} />
          {previewUrl && (
            <Button type="button" variant="destructive" size="icon" onClick={removeFile}>
              <Trash />
            </Button>
          )}
        </div>
      )}
      {extension === '.iix' && previewUrl && (
        <div>
          <img src={previewUrl} className="w-full max-h-[250px] object-contain" alt="preview" />
        </div>
      )}
      {extension === '.vvx' && previewUrl && (
        <div>
          <video ref={videoRef} className="w-full max-h-[250px] object-contain" controls preload="auto">
            <source src={previewUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  )
}
