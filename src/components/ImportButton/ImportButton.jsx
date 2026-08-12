import { useRef, useState } from 'react'
import { Upload, FileUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ImportButton({
  onImport,
  accept = '.csv',
  label = 'Import CSV',
  className,
}) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState(null)

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    onImport?.(file)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-1.5 h-3.5 w-3.5" /> {label}
      </Button>
      {fileName ? (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> {fileName}
        </span>
      ) : null}
    </div>
  )
}

export default ImportButton
