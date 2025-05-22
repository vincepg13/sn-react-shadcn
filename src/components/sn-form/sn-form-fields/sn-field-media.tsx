import { Input } from '@kit/components/ui/input'
import { SnFieldBaseProps, SnFieldSchema } from '@kit/types/form-schema'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { useFieldUI } from '../contexts/FieldUIContext'
import { Trash } from 'lucide-react'
import { Button } from '@kit/components/ui/button'
import { useFormLifecycle } from '../contexts/SnFormLifecycleContext'
import { deleteAttachment, uploadFieldAttachment } from '@kit/utils/attachment-api'

interface SnFieldMediaProps extends Omit<SnFieldBaseProps<string>, 'field'> {
  field: SnFieldSchema
  extension: string
  table: string
  attachmentGuid: string
  onChange: (value: string) => void
}

type lifecycleData = {
  file: File | null
  value: string
}

export function SnFieldMedia({ field, rhfField, onChange, table, extension, attachmentGuid }: SnFieldMediaProps) {
  const ld = useRef<lifecycleData | null>(null)
  const fieldVal = String(rhfField.value ?? '')
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const snFixedValue = field.displayValue ? field.displayValue.replace(extension, '') : ''

  const { readonly } = useFieldUI()
  const { formConfig, registerPreUiActionCallback } = useFormLifecycle()

  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const [origValue] = useState<string>(fieldVal)

  const fullSrcPath = getFullSrcPath(formConfig.base_url, fieldVal)

  function getFullSrcPath(baseUrl: string, snValue: string) {
    if (!snValue) return ''
    if (extension === '.vvx') {
      const guid = snValue.replace(extension, '')
      return `${baseUrl}/sys_attachment.do?sys_id=${guid}`
    }
    if (snValue.endsWith(extension)) return `${baseUrl}${snValue}`
    return `${baseUrl}${snValue}${extension}`
  }

  useEffect(() => {
    return () => {
      if (source?.startsWith('blob:')) {
        URL.revokeObjectURL(source)
      }
    }
  }, [source])

  useEffect(() => {
    ld.current = {
      file,
      value: fieldVal || '',
    }
  }, [fieldVal, file])

  useEffect(() => {
    registerPreUiActionCallback(field.name, async () => {
      if (origValue && !ld.current?.file && !rhfField.value) {
        const res = await deleteAttachment(snFixedValue)
        if (res) onChange('')
        return
      }

      if (!ld.current?.file) return

      const upload = await uploadFieldAttachment(ld.current.file, table, attachmentGuid, field.name)
      if (upload) {
        console.log('SETTINH IMAGE', upload)
        onChange?.(upload)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rhfField.value])

  function removeFile() {
    if (source?.startsWith('blob:')) URL.revokeObjectURL(source)
    setFile(null)
    setSource(null)
    onChange('')
    field.temp_value = ''
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const previewUrl = URL.createObjectURL(selectedFile)
      setSource(previewUrl)
      field.temp_value = previewUrl
      onChange(selectedFile.name.substring(0, 40))
    }
  }

  const accept = extension === '.iix' ? 'image/*' : extension === '.vvx' ? 'video/*' : ''
  const previewUrl = source || field.temp_value || fullSrcPath || undefined

    useEffect(() => {
    if (extension === '.vvx' && videoRef.current) {
      videoRef.current.load()
    }
  }, [previewUrl, extension])

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
