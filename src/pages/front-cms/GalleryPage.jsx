// ====================================================================
// Module: Front CMS
// Page: Gallery
//
// Purpose:
// Manage gallery items.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Image, Eye, Pencil, Trash2 } from 'lucide-react'
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
  { key: 'gallery_title', label: 'Gallery Title' },
  { key: 'category', label: 'Category' },
  { key: 'image_url', label: 'Image URL' },
  { key: 'createdAt', label: 'Created At' },
]

export default function GalleryPage() {
  const { toast } = useToast()
  const { data: gallery, isLoading, refetch } = useAsyncData(() => frontCmsService.getGallery(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = gallery || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.gallery_title || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'gallery_title',
      header: 'Gallery Item',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Image className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.gallery_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.category || 'No category'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'image_url', header: 'Image', cell: ({ row }) => row.original.image_url ? <img src={row.original.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <span className="text-sm text-muted-foreground">—</span> },
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
        await frontCmsService.updateGallery(id, payload)
        toast({ title: 'Gallery item updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createGallery(payload, file)
        toast({ title: 'Gallery item created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save gallery item:', error)
      toast({ title: 'Failed to save gallery item', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontCmsService.deleteGallery(id)
      toast({ title: 'Gallery item deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete gallery item:', error)
      toast({ title: 'Failed to delete gallery item', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Gallery' }]} />
      <PageHeader
        title="Gallery"
        description="Manage gallery items."
        icon={Image}
        actions={<Button onClick={() => setAddOpen(true)}><Image className="mr-2 h-4 w-4" /> Add Gallery Item</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Items" value={stats.total} icon={Image} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or category…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="gallery" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No gallery items found" description="Add a gallery item to get started." actionLabel="Add Gallery Item" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Gallery Item' : 'Add Gallery Item'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update gallery item details' : 'Add a new gallery item'}</DialogDescription>
          </DialogHeader>
          <GalleryForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Gallery Item Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Gallery Title', value: viewRow.gallery_title || '—' },
              { label: 'Category', value: viewRow.category || '—' },
              { label: 'Image URL', value: viewRow.image_url || '—' },
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
            <DialogTitle>Delete Gallery Item</DialogTitle>
            <DialogDescription>Are you sure you want to delete this gallery item? This action cannot be undone.</DialogDescription>
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

function GalleryForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    gallery_title: '', category: '',
  })
  const [file, setFile] = useState(null)

  useState(() => {
    if (initial) {
      setFormData({
        gallery_title: initial.gallery_title || '', category: initial.category || '',
      })
    } else {
      setFormData({
        gallery_title: '', category: '',
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
        <Label htmlFor="gallery_title">Gallery Title *</Label>
        <Input id="gallery_title" value={formData.gallery_title} onChange={(e) => setFormData({ ...formData, gallery_title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="image">Image *</Label>
        <Input id="image" type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" required={!initial} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
