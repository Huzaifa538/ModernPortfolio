import { useRef, useState, type DragEvent } from 'react'
import { FileUp, Loader2, Trash2, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import { api, resolveAssetUrl } from '../../lib/api'

interface FileUploaderProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  /** e.g. "image/*" or "application/pdf" */
  accept?: string
  hint?: string
  maxSizeMB?: number
  previewAsImage?: boolean
}

/**
 * Drag-and-drop file upload.
 * Uploads straight to POST /api/admin/upload and returns the stored path.
 */
export function FileUploader({
  value,
  onChange,
  label = 'File',
  accept = 'image/*',
  hint = 'PNG, JPG, WEBP, SVG — up to 5 MB',
  maxSizeMB = 5,
  previewAsImage = true,
}: FileUploaderProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const acceptsImages = accept.includes('image')

  const uploadFile = async (file: File) => {
    if (acceptsImages && !file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File must be under ${maxSizeMB} MB`)
      return
    }
    setUploading(true)
    try {
      const url = await api.upload(file)
      onChange(url)
      toast.success('File uploaded')
    } catch {
      toast.error('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const preview = resolveAssetUrl(value)
  const fileName = value?.split('/').pop()

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--text)]">{label}</p>
      {preview ? (
        <div className="relative inline-block">
          {previewAsImage ? (
            <img
              src={preview}
              alt="Uploaded preview"
              className="h-36 w-auto max-w-full rounded-xl border border-[var(--border)] object-cover"
            />
          ) : (
            <a
              href={preview}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 text-sm font-medium transition hover:border-[#8b5cf6]/50"
            >
              <FileUp className="h-4 w-4 text-[#8b5cf6]" />
              {fileName ?? 'Uploaded file'}
            </a>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove file"
            className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg transition hover:bg-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex h-36 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition ${
            dragging
              ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
              : 'border-[var(--border)] bg-[var(--surface2)]/50 hover:border-[#8b5cf6]/50'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-[#8b5cf6]" />
          ) : (
            <UploadCloud className="h-7 w-7 text-[var(--muted)]" />
          )}
          <span className="text-sm text-[var(--muted)]">
            {uploading ? 'Uploading…' : dragging ? 'Drop it!' : 'Drag & drop or click to upload'}
          </span>
          <span className="font-mono text-[11px] text-[var(--muted)] opacity-70">{hint}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        aria-label={`${label} file input`}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) uploadFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/** Convenience wrapper for the common image-upload case. */
export function ImageUploader(props: Omit<FileUploaderProps, 'accept' | 'hint' | 'previewAsImage'>) {
  return <FileUploader {...props} />
}
