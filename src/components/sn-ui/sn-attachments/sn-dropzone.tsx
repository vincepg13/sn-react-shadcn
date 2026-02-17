import Dropzone from 'shadcn-dropzone'
import { Button } from '@kit/components/ui/button'
import { TooltipProvider } from '@kit/components/ui/tooltip'
import { LoaderCircle, Trash2, Upload } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@kit/components/ui/tooltip'

type DropzoneProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  onFileSave: () => Promise<void>
  isSaving?: boolean
  showActionRow?: boolean
}

export function SnDropzone({
  files,
  onFilesChange,
  onFileSave,
  isSaving = false,
  showActionRow = true,
}: DropzoneProps) {
  const handleSave = async () => {
    if (isSaving) return
    try {
      await onFileSave()
    } catch (error) {
      console.error('Error saving files:', error)
    }
  }

  return (
    <>
      <Dropzone onDrop={onFilesChange}>
        {dropzone => (
          <div
            {...dropzone.getRootProps()}
            className="min-h-[100px] flex flex-col items-center justify-center gap-2 text-sm"
          >
            <input {...dropzone.getInputProps()} />

            {!files.length ? (
              <>
                <p className="text-sm font-medium flex gap-1 items-center">
                  <Upload />
                  <span>Upload Files</span>
                </p>
                <p className="text-muted-foreground">Click here or drag and drop</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium flex gap-1 items-center">
                  <Upload />
                  <span>Files to upload: {files.length}</span>
                </p>
                <p className="text-muted-foreground">
                  {showActionRow
                    ? 'Attachments will be saved automatically when saving the record.'
                    : 'Use the buttons below to upload the files or cancel'}
                </p>
              </>
            )}
          </div>
        )}
      </Dropzone>
      {!!files.length && showActionRow && (
        <div className="flex gap-2 align-center">
          {!isSaving && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" onClick={() => onFilesChange([])} variant="outline" className="text-red-500">
                    <Trash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancel Upload</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button type="button" onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <span className="flex gap-2 items-center">
                <span>
                  <LoaderCircle className="animate-spin" />
                </span>
                <span>Uploading...</span>
              </span>
            ) : (
              <span>Upload Files</span>
            )}
          </Button>
        </div>
      )}
    </>
  )
}
