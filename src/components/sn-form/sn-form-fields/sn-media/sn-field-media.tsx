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
  onChange: (value: string, displayValue?: string) => void
}

export function SnFieldMedia({ field, rhfField, onChange, table, extension, attachmentGuid }: SnFieldMediaProps) {
  const fieldVal = String(rhfField.value ?? '')
  const isFileAttachment = extension === ''
  const { readonly } = useFieldUI()
  const { formConfig, registerPreUiActionCallback } = useFormLifecycle()
  const fileInputRef = useRef<HTMLInputElement>(null!)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [fileLabel, setFileLabel] = useState<string>(field.displayValue || '')
  //const snFixedValue = field.displayValue?.replace(extension, '') ?? ''
  const [origValue, setOrigValue] = useState<string>(field.value || '')

  console.log("ORIG VAL: " + field.name, origValue, fieldVal);

  const {
    file,
    setFile,
    source,
    setSource,
  } = useMediaPreview(field.staged_data?.file || null, fileInputRef)

  const previewUrl = source || field.staged_data?.preview || getFullSrcPath(formConfig.base_url, fieldVal)
  const persistedAttachmentId = isFileAttachment && origValue && origValue === fieldVal ? origValue : ''

  console.log("INIT LIFECYCLE MEDIA: " + field.name, { file, fieldVal, origValue })

  useMediaLifecycle({
    field,
    file,
    fieldVal,
    origValue,
    displayValue: fileLabel,
    table,
    extension,
    attachmentGuid,
    onChange,
    setOrigValue,
    clearLocalFile,
    registerPreUiActionCallback,
  })

  useEffect(() => {
    setFileLabel(field.displayValue || '')
  }, [field.displayValue])

  useEffect(() => {
    if (extension === '.vvx' && videoRef.current) {
      videoRef.current.load()
    }
  }, [previewUrl, extension])

  const accept = extension === '.iix' ? 'image/*' : extension === '.vvx' ? 'video/*' : undefined

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
    setFileLabel('')
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
      setFileLabel(selectedFile.name)
      onChange(selectedFile.name.substring(0, 40), selectedFile.name)

      field.staged_data = {
        file: selectedFile,
        preview: previewUrl,
      }
    }
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-2">
      {(isFileAttachment || !readonly) && (
        <div className="flex min-w-0 w-full flex-col gap-1">
          <div className="flex gap-2">
            {!readonly && <Input type="file" accept={accept} ref={fileInputRef} onChange={handleFileChange} />}
            {!readonly && previewUrl && (
              <Button type="button" variant="destructive" size="icon" onClick={removeFile}>
                <Trash />
              </Button>
            )}
          </div>
          {isFileAttachment && fileLabel && (
            <p className="w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground">
              {persistedAttachmentId ? (
                <a
                  href={`${formConfig.base_url}/sys_attachment.do?sys_id=${persistedAttachmentId}`}
                  className="text-blue-400 block w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap underline underline-offset-2"
                  rel="noreferrer"
                >
                  {fileLabel}
                </a>
              ) : (
                fileLabel
              )}
            </p>
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
