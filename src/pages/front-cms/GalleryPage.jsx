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

import { useMemo, useState, useEffect } from 'react'
import { Image as ImageIcon, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
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
  
  // Loading states for async operations
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Table columns with image thumbnail
  const columns = useMemo(() => [
    {
      accessorKey: 'image_url',
      header: 'Image',
      cell: ({ row }) => (
        <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
          {row.original.image_url ? (
            <img 
              src={row.original.image_url} 
              alt={row.original.gallery_title || 'Gallery'} 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'gallery_title',
      header: 'Gallery Item',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.gallery_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.category || 'No category'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  // Handle save (create/update) with loading state
  const handleSave = async (payload, file, id) => {
    setIsSaving(true)
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
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete with loading state
  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      await frontCmsService.deleteGallery(id)
      toast({ title: 'Gallery item deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete gallery item:', error)
      toast({ title: 'Failed to delete gallery item', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Gallery' }]} />
      <PageHeader
        title="Gallery"
        description="Manage gallery items."
        icon={ImageIcon}
        actions={<Button onClick={() => setAddOpen(true)}><ImageIcon className="mr-2 h-4 w-4" /> Add Gallery Item</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Items" value={stats.total} icon={ImageIcon} accent="primary" />
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
          <GalleryForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

       {/* View drawer with full image display */}
      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Gallery Item Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <div className="space-y-6">
            {viewRow.image_url && (
              <div className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground">Gallery Image</dt>
                <div className="overflow-hidden rounded-lg border">
                  <img 
                    src={viewRow.image_url} 
                    alt={viewRow.gallery_title || 'Gallery'} 
                    className="w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Gallery Title', value: viewRow.gallery_title || '—' },
                { label: 'Category', value: viewRow.category || '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      {/* Delete confirmation dialog with loading state */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gallery Item</DialogTitle>
            <DialogDescription>Are you sure you want to delete this gallery item? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Gallery form with image preview and loading state
function GalleryForm({ initial, onSubmit, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    gallery_title: '', category: '',
  })
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Initialize form based on edit/add mode
  useEffect(() => {
    if (initial) {
      setFormData({
        gallery_title: initial.gallery_title || '', 
        category: initial.category || '',
      })
      setPreviewUrl(initial.image_url || null)
    } else {
      setFormData({
        gallery_title: '', 
        category: '',
      })
      setPreviewUrl(null)
    }
  }, [initial])

  // Handle file selection with preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
    }
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setFile(null)
    setPreviewUrl(null)
  }

  // Submit form
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
        <div className="space-y-3">
          {/* Image preview */}
          {previewUrl && (
            <div className="relative overflow-hidden rounded-lg border">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="h-48 w-full object-cover"
              />
              {!initial && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={handleRemoveImage}
                >
                  Remove
                </Button>
              )}
            </div>
          )}
          {/* File input */}
          {!initial && (
            <Input 
              id="image" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*" 
              required={!previewUrl}
            />
          )}
          {initial && (
            <p className="text-xs text-muted-foreground">
              To change the image, delete this gallery item and create a new one.
            </p>
          )}
        </div>
      </div>
      {/* Form footer with loading state */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
