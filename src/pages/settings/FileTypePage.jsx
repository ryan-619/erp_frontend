// ====================================================================
// Module: Settings
// Page: File Type Settings
//
// Purpose:
// Manage allowed file extensions and maximum upload size.
//
// Backend fields: allowed_extensions ([String]), max_size (Number)
// Note: No delete endpoint. updateFileType takes payload (no id).
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { DataTable } from '@/components/DataTable'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { useFileTypes } from '@/hooks/useSettings'

const EXPORT_COLS = [
  { key: 'allowed_extensions', label: 'Allowed Extensions' },
  { key: 'max_size', label: 'Max Size (MB)' },
]

export default function FileTypePage() {
  const { rows, isLoading, search, setSearch, saveFileType } = useFileTypes()

  const columns = useMemo(() => [
    { accessorKey: 'allowed_extensions', header: 'Allowed Extensions', cell: ({ row }) => {
      const exts = Array.isArray(row.original.allowed_extensions) ? row.original.allowed_extensions : []
      return exts.length > 0
        ? <div className="flex flex-wrap gap-1">{exts.map((e) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}</div>
        : <span className="text-muted-foreground">—</span>
    } },
    { accessorKey: 'max_size', header: 'Max Size (MB)' },
  ], [])

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'File Types' }]} />
      <PageHeader
        title="File Type Settings"
        description="Manage allowed file extensions and maximum upload size."
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search extensions…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={3} cols={2} />
      ) : rows.length === 0 ? (
        <NoData title="No file type settings found" description="Configure allowed extensions below." />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableExport
          exportFilename="file-types"
        />
      )}

      <FileTypeForm
        initial={rows[0]}
        isLoading={isLoading}
        onSave={saveFileType}
      />
    </div>
  )
}

function FileTypeForm({ initial, isLoading, onSave }) {
  const [form, setForm] = useState({
    allowed_extensions: Array.isArray(initial?.allowed_extensions) ? initial.allowed_extensions.join(', ') : '',
    max_size: initial?.max_size ?? 5,
  })

  useEffect(() => {
    if (initial) {
      setForm({
        allowed_extensions: Array.isArray(initial.allowed_extensions) ? initial.allowed_extensions.join(', ') : '',
        max_size: initial.max_size ?? 5,
      })
    }
  }, [initial])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = () => {
    const exts = form.allowed_extensions.split(',').map((e) => e.trim()).filter(Boolean)
    onSave({ allowed_extensions: exts, max_size: Number(form.max_size) || 1 })
  }

  const handleReset = () => {
    if (initial) {
      setForm({
        allowed_extensions: Array.isArray(initial.allowed_extensions) ? initial.allowed_extensions.join(', ') : '',
        max_size: initial.max_size ?? 5,
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">File Upload Configuration</CardTitle>
        <CardDescription>Set the allowed file extensions and maximum upload size.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Allowed Extensions (comma-separated)</Label>
            <Input value={form.allowed_extensions} onChange={(e) => set('allowed_extensions', e.target.value)} placeholder="jpg, png, pdf, docx" />
            <p className="text-xs text-muted-foreground">Separate each extension with a comma. Do not include the leading dot.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Size (MB)</Label>
            <Input type="number" min="1" value={form.max_size} onChange={(e) => set('max_size', e.target.value)} />
          </div>
        </FormSection>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
        <Button onClick={handleSubmit} disabled={isLoading}><Save className="mr-2 h-4 w-4" /> Save</Button>
      </CardFooter>
    </Card>
  )
}
