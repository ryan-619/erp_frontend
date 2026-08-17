// ====================================================================
// Module: Front CMS
// Page: Banner Images
//
// Purpose:
// Manage banner images.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Image, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
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
  { key: 'title', label: 'Title' },
  { key: 'link', label: 'Link' },
  { key: 'order', label: 'Order' },
  { key: 'createdAt', label: 'Created At' },
]

export default function BannerPage() {
  const { toast } = useToast()
  const { data: banners, isLoading, refetch } = useAsyncData(() => frontCmsService.getBanners(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const rows = banners || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.title || '').toLowerCase().includes(q) ||
      (r.link || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'image_url',
      header: 'Image',
      cell: ({ row }) => (
        <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
          {row.original.image_url ? (
            <img 
              src={row.original.image_url} 
              alt={row.original.title || 'Banner'} 
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Image className="h-6 w-6" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Banner',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">Order: {row.original.order || 0}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'link', header: 'Link', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.link || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, file, id) => {
    setIsSaving(true)
    try {
      if (id) {
        await frontCmsService.updateBanner(id, payload)
        toast({ title: 'Banner updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createBanner(payload, file)
        toast({ title: 'Banner created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save banner:', error)
      toast({ title: 'Failed to save banner', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      await frontCmsService.deleteBanner(id)
      toast({ title: 'Banner deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete banner:', error)
      toast({ title: 'Failed to delete banner', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Banner Images' }]} />
      <PageHeader
        title="Banner Images"
        description="Manage banner images."
        icon={Image}
        actions={<Button onClick={() => setAddOpen(true)}><Image className="mr-2 h-4 w-4" /> Add Banner</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Banners" value={stats.total} icon={Image} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or link…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="banners" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No banners found" description="Add a banner to get started." actionLabel="Add Banner" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update banner details' : 'Add a new banner'}</DialogDescription>
          </DialogHeader>
          <BannerForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Banner Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <div className="space-y-6">
            {viewRow.image_url && (
              <div className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground">Banner Image</dt>
                <div className="overflow-hidden rounded-lg border">
                  <img 
                    src={viewRow.image_url} 
                    alt={viewRow.title || 'Banner'} 
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
                { label: 'Title', value: viewRow.title || '—' },
                { label: 'Link', value: viewRow.link || '—' },
                { label: 'Order', value: viewRow.order || 0 },
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

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
            <DialogDescription>Are you sure you want to delete this banner? This action cannot be undone.</DialogDescription>
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

function BannerForm({ initial, onSubmit, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    title: '', link: '', order: 0,
  })
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (initial) {
      setFormData({
        title: initial.title || '', link: initial.link || '', order: initial.order || 0,
      })
      setPreviewUrl(initial.image_url || null)
    } else {
      setFormData({
        title: '', link: '', order: 0,
      })
      setPreviewUrl(null)
    }
  }, [initial])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)
    }
  }

  const handleRemoveImage = () => {
    setFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="link">Link</Label>
        <Input id="link" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="order">Order</Label>
        <Input id="order" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
      </div>
      <div>
        <Label htmlFor="image">Image *</Label>
        <div className="space-y-3">
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
              To change the image, delete this banner and create a new one.
            </p>
          )}
        </div>
      </div>
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
