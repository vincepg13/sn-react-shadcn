import { useEffect, useState, RefObject } from "react"

export function useMediaPreview(
  stagedFile: File | null,
  fileInputRef: RefObject<HTMLInputElement>
) {
  const [file, setFile] = useState<File | null>(stagedFile || null)
  const [source, setSource] = useState<string | null>(null)

  // Restore file + preview on mount (for tab switch)
  useEffect(() => {
    if (file && !source) {
      const previewUrl = URL.createObjectURL(file)
      setSource(previewUrl)
    }
  }, [file, source])

  // Restore file input label
  useEffect(() => {
    if (file && fileInputRef.current) {
      try {
        const dt = new DataTransfer()
        dt.items.add(file)
        fileInputRef.current.files = dt.files
      } catch (err) {
        console.warn("Unable to restore file input label:", err)
      }
    }
  }, [file, fileInputRef])

  // Clean up blob URL
  useEffect(() => {
    return () => {
      if (source?.startsWith("blob:")) {
        URL.revokeObjectURL(source)
      }
    }
  }, [source])

  return {
    file,
    setFile,
    source,
    setSource,
  }
}
