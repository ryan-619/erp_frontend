// ====================================================================
// Module: Front CMS
// Page: News
//
// Purpose:
// Manage news articles.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Newspaper, Eye, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  { key: 'author', label: 'Author' },
  { key: 'publish_date', label: 'Publish Date' },
  { key: 'createdAt', label: 'Created At' },
]

export default function NewsPage() {
  const { toast } = useToast()
  const { data: news, isLoading, refetch } = useAsyncData(() => frontCmsService.getNews(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  
  // Loading states for async operations
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const rows = news || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.title || '').toLowerCase().includes(q) ||
      (r.author || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  // Table columns with image thumbnail
  const columns = useMemo(() => [
    {
      accessorKey: 'image',
      header: 'Image',
      cell: ({ row }) => (
        <div className="h-16 w-24 overflow-hidden rounded-lg bg-muted">
          {row.original.image ? (
            <img 
              src={row.original.image} 
              alt={row.original.title || 'News'} 
              className="h-full w-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
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
      accessorKey: 'title',
      header: 'News',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.author || 'No author'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'publish_date', header: 'Published', cell: ({ row }) => row.original.publish_date ? formatDate(row.original.publish_date) : '—' },
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
        await frontCmsService.updateNews(id, payload)
        toast({ title: 'News updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createNews(payload, file)
        toast({ title: 'News created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save news:', error)
      toast({ title: 'Failed to save news', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete with loading state
  const handleDelete = async (id) => {
    setIsDeleting(true)
    try {
      await frontCmsService.deleteNews(id)
      toast({ title: 'News deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete news:', error)
      toast({ title: 'Failed to delete news', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'News' }]} />
      <PageHeader
        title="News"
        description="Manage news articles."
        icon={Newspaper}
        actions={<Button onClick={() => setAddOpen(true)}><Newspaper className="mr-2 h-4 w-4" /> Add News</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total News" value={stats.total} icon={Newspaper} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or author…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="news" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No news found" description="Add news to get started." actionLabel="Add News" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit News' : 'Add News'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update news details' : 'Add a new news article'}</DialogDescription>
          </DialogHeader>
          <NewsForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} isSaving={isSaving} />
        </DialogContent>
      </Dialog>

      {/* View drawer with full image display */}
      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="News Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <div className="space-y-6">
            {viewRow.image && (
              <div className="space-y-2">
                <dt className="text-xs font-medium text-muted-foreground">News Image</dt>
                <div className="overflow-hidden rounded-lg border">
                  <img 
                    src={viewRow.image} 
                    alt={viewRow.title || 'News'} 
                    className="w-full object-cover"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Title', value: viewRow.title || '—' },
                { label: 'Author', value: viewRow.author || '—' },
                { label: 'Publish Date', value: viewRow.publish_date ? formatDate(viewRow.publish_date) : '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
              <div className="col-span-full space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">Content</dt>
                <dd className="text-sm font-medium whitespace-pre-wrap">{viewRow.content || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Drawer>

      {/* Delete confirmation dialog with loading state */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete News</DialogTitle>
            <DialogDescription>Are you sure you want to delete this news? This action cannot be undone.</DialogDescription>
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

// News form with image preview and loading state
function NewsForm({ initial, onSubmit, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    title: '', content: '', publish_date: '', author: '',
  })
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Initialize form based on edit/add mode
  useEffect(() => {
    if (initial) {
      setFormData({
        title: initial.title || '', 
        content: initial.content || '', 
        publish_date: initial.publish_date ? initial.publish_date.split('T')[0] : '', 
        author: initial.author || '',
      })
      // Show existing image if available
      setPreviewUrl(initial.image || null)
    } else {
      setFormData({
        title: '', 
        content: '', 
        publish_date: new Date().toISOString().split('T')[0], // Default to today
        author: '',
      })
      setPreviewUrl(null)
    }
  }, [initial])

  // Handle file selection with preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Create object URL for immediate preview
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
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="author">Author</Label>
        <Input id="author" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="publish_date">Publish Date *</Label>
        <Input id="publish_date" type="date" value={formData.publish_date} onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="News content..." rows={4} />
      </div>
      <div>
        <Label htmlFor="image">Image</Label>
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
            />
          )}
          {initial && (
            <p className="text-xs text-muted-foreground">
              To change the image, delete this news and create a new one.
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
