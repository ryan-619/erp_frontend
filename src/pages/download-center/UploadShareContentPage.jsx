// ====================================================================
// Module: Download Center
// Page: Upload / Share Content
//
// Purpose:
// Manage uploaded downloadable content — files, documents, and
// study materials classified by content type.
//
// Data Source:
// downloadCenter.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import {
  Download,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { StatusBadge } from '@/components/StatusBadge'
import { useContents } from '@/hooks/useDownloadCenter'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'title', label: 'Title' },
  { key: 'content_type_name', label: 'Content Type' },
  { key: 'file_size', label: 'File Size' },
  { key: 'uploaded_by', label: 'Uploaded By' },
  { key: 'uploaded_at', label: 'Uploaded At' },
  { key: 'status', label: 'Status' },
]

export default function UploadShareContentPage() {
  const {
    rows, contentTypes, stats, isLoading,
    search, setSearch,
    typeFilter, setTypeFilter,
    saveContent, deleteContent,
  } = useContents()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveContent(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="h-4 w-4" />
          </div>
          <span className="font-medium hover:underline">{row.original.title}</span>
        </button>
      ),
    },
    { 
      accessorKey: 'content_type_id', 
      header: 'Content Type', 
      cell: ({ row }) => {
        const type = contentTypes.find(t => t._id === row.original.content_type_id)
        return type ? type.content_type_name : row.original.content_type_id
      }
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [contentTypes])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Download Center' }, { label: 'Upload / Share Content' }]} />
      <PageHeader
        title="Upload / Share Content"
        description="Manage uploaded documents, study materials, and downloadable files."
        icon={Upload}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Upload Content</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Contents" value={stats.total_contents ?? 0} icon={Download} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or description…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={rows} columns={EXPORT_COLS} filename="upload-share-content" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All types</option>
            {contentTypes.map((t) => <option key={t._id} value={t._id}>{t.content_type_name}</option>)}
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No content found" description="Upload new content to get started." actionLabel="Upload Content" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="upload-share-content"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Reusable Content Form Drawer used for both Add and Edit. */}
      <ContentFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Content' : 'Upload Content'}
        initial={editRow}
        contentTypes={contentTypes}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Content Details"
        description={viewRow?.title}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{viewRow.title}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Content Type', value: contentTypes.find(t => t._id === viewRow.content_type_id)?.content_type_name || 'Unknown' },
                { label: 'Description', value: viewRow.description },
                { label: 'File URL', value: viewRow.file_url },
                { label: 'Created On', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.title}
        onConfirm={() => deleteContent(deleteRow._id)}
      />
    </div>
  )
}

// ─── Content Form Drawer (shared by Add and Edit) ─────────────────────────────
function ContentFormDrawer({ open, onOpenChange, title, initial, contentTypes, onSubmit }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    content_type_id: initial?.content_type_id || '',
    file_url: initial?.file_url || '',
    description: initial?.description || '',
  })
  const [file, setFile] = useState(null)

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleSubmit = async () => {
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('content_type_id', form.content_type_id)
    formData.append('description', form.description)
    if (file) {
      formData.append('file', file)
    } else if (form.file_url) {
      formData.append('file_url', form.file_url)
    }
    await onSubmit(formData)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Upload content details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Upload Content'}
          submitDisabled={!form.title.trim() || !form.content_type_id}
          onSubmit={handleSubmit}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Content title" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Content Type <span className="text-destructive">*</span></Label>
            <select value={form.content_type_id} onChange={(e) => set('content_type_id', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select content type</option>
              {contentTypes.map((t) => (
                <option key={t._id} value={t._id}>{t.content_type_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">File Upload</Label>
            <input type="file" onChange={handleFileChange}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Or File URL</Label>
            <Input value={form.file_url} onChange={(e) => set('file_url', e.target.value)} placeholder="https://example.com/file.pdf" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Content description" rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
