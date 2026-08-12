// ====================================================================
// Module: Front CMS
// Page: Media Manager
//
// Purpose:
// Manage media files.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { FileImage, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { frontCmsService } from '@/services/frontCms.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'file_name', label: 'File Name' },
  { key: 'file_type', label: 'File Type' },
  { key: 'file_url', label: 'File URL' },
  { key: 'createdAt', label: 'Created At' },
]

export default function MediaManagerPage() {
  const { toast } = useToast()
  const { data: media, isLoading, refetch } = useAsyncData(() => frontCmsService.getMedia(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = media || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.file_name || '').toLowerCase().includes(q) ||
      (r.file_type || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'file_name',
      header: 'File',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileImage className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.file_name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.file_type || 'No type'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'file_url', header: 'URL', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.file_url || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, file, id) => {
    try {
      if (id) {
        await frontCmsService.updateMedia(id, payload)
        toast({ title: 'Media updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createMedia(payload, file)
        toast({ title: 'Media uploaded successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save media:', error)
      toast({ title: 'Failed to save media', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontCmsService.deleteMedia(id)
      toast({ title: 'Media deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete media:', error)
      toast({ title: 'Failed to delete media', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Media Manager' }]} />
      <PageHeader
        title="Media Manager"
        description="Manage media files."
        icon={FileImage}
        actions={<Button onClick={() => setAddOpen(true)}><FileImage className="mr-2 h-4 w-4" /> Upload Media</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Files" value={stats.total} icon={FileImage} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or type…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="media" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No media found" description="Upload media to get started." actionLabel="Upload Media" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Media' : 'Upload Media'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update media details' : 'Upload a new media file'}</DialogDescription>
          </DialogHeader>
          <MediaForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Media Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'File Name', value: viewRow.file_name || '—' },
              { label: 'File Type', value: viewRow.file_type || '—' },
              { label: 'File URL', value: viewRow.file_url || '—' },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Media</DialogTitle>
            <DialogDescription>Are you sure you want to delete this media? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MediaForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    file_name: '', file_type: '',
  })
  const [file, setFile] = useState(null)

  useState(() => {
    if (initial) {
      setFormData({
        file_name: initial.file_name || '', file_type: initial.file_type || '',
      })
    } else {
      setFormData({
        file_name: '', file_type: '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="file_name">File Name *</Label>
        <Input id="file_name" value={formData.file_name} onChange={(e) => setFormData({ ...formData, file_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="file_type">File Type</Label>
        <Input id="file_type" value={formData.file_type} onChange={(e) => setFormData({ ...formData, file_type: e.target.value })} placeholder="image, document, video, etc." />
      </div>
      <div>
        <Label htmlFor="file">File *</Label>
        <Input id="file" type="file" onChange={(e) => setFile(e.target.files[0])} required={!initial} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
