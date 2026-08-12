// ====================================================================
// Module: Download Center
// Page: Video Tutorials
//
// Purpose:
// Manage video tutorials — educational videos categorized by subject
// with thumbnails and duration tracking.
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
  Video,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Play,
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
import { useVideoTutorials } from '@/hooks/useDownloadCenter'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'duration', label: 'Duration' },
  { key: 'uploaded_by', label: 'Uploaded By' },
  { key: 'uploaded_at', label: 'Uploaded At' },
  { key: 'status', label: 'Status' },
]

export default function VideoTutorialsPage() {
  const {
    rows, stats, isLoading,
    search, setSearch,
    categories,
    saveVideo, deleteVideo,
  } = useVideoTutorials()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveVideo(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Video',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="h-4 w-4" />
          </div>
          <span className="font-medium hover:underline">{row.original.title}</span>
        </button>
      ),
    },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Download Center' }, { label: 'Video Tutorials' }]} />
      <PageHeader
        title="Video Tutorials"
        description="Manage educational video tutorials categorized by subject."
        icon={Video}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Video</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Videos" value={stats.total_videos ?? 0} icon={Video} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or description…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={rows} columns={EXPORT_COLS} filename="video-tutorials" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <NoData title="No video tutorials found" description="Add a new video tutorial to get started." actionLabel="Add Video" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="video-tutorials"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Reusable Video Form Drawer used for both Add and Edit. */}
      <VideoFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Video Tutorial' : 'Add Video Tutorial'}
        initial={editRow}
        categories={categories}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Video Details"
        description={viewRow?.title}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Play className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{viewRow.title}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Category', value: viewRow.category },
                { label: 'Description', value: viewRow.description },
                { label: 'Video URL', value: viewRow.video_url },
                { label: 'Thumbnail', value: viewRow.thumbnail },
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
        onConfirm={() => deleteVideo(deleteRow._id)}
      />
    </div>
  )
}

// ─── Video Form Drawer (shared by Add and Edit) ───────────────────────────────
function VideoFormDrawer({ open, onOpenChange, title, initial, categories, onSubmit }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    video_url: initial?.video_url || '',
    thumbnail: initial?.thumbnail || '',
    category: initial?.category || '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Video tutorial information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Video'}
          submitDisabled={!form.title.trim() || !form.video_url.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Video title" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Mathematics" list="category-list" />
            <datalist id="category-list">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Video URL <span className="text-destructive">*</span></Label>
            <Input value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://example.com/video" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Thumbnail URL</Label>
            <Input value={form.thumbnail} onChange={(e) => set('thumbnail', e.target.value)} placeholder="https://images.example.com/thumb.jpg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Video description" rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
