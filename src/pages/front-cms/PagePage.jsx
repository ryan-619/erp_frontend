// ====================================================================
// Module: Front CMS
// Page: Pages
//
// Purpose:
// Manage CMS pages.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { FileText, Eye, Pencil, Trash2 } from 'lucide-react'
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
  { key: 'page_title', label: 'Page Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'meta_title', label: 'Meta Title' },
  { key: 'createdAt', label: 'Created At' },
]

export default function PagePage() {
  const { toast } = useToast()
  const { data: pages, isLoading, refetch } = useAsyncData(() => frontCmsService.getPages(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = pages || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.page_title || '').toLowerCase().includes(q) ||
      (r.slug || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'page_title',
      header: 'Page',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.page_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">/{row.original.slug || 'no-slug'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'meta_title', header: 'Meta Title', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.meta_title || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await frontCmsService.updatePage(id, payload)
        toast({ title: 'Page updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createPage(payload)
        toast({ title: 'Page created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save page:', error)
      toast({ title: 'Failed to save page', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontCmsService.deletePage(id)
      toast({ title: 'Page deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete page:', error)
      toast({ title: 'Failed to delete page', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Pages' }]} />
      <PageHeader
        title="Pages"
        description="Manage CMS pages."
        icon={FileText}
        actions={<Button onClick={() => setAddOpen(true)}><FileText className="mr-2 h-4 w-4" /> Add Page</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Pages" value={stats.total} icon={FileText} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or slug…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="pages" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No pages found" description="Add a page to get started." actionLabel="Add Page" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Page' : 'Add Page'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update page details' : 'Add a new CMS page'}</DialogDescription>
          </DialogHeader>
          <PageForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Page Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Page Title', value: viewRow.page_title || '—' },
              { label: 'Slug', value: viewRow.slug || '—' },
              { label: 'Meta Title', value: viewRow.meta_title || '—' },
              { label: 'Meta Description', value: viewRow.meta_description || '—' },
              { label: 'Content', value: viewRow.content || '—' },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium whitespace-pre-wrap">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>Are you sure you want to delete this page? This action cannot be undone.</DialogDescription>
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

function PageForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    page_title: '', slug: '', content: '', meta_title: '', meta_description: '',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        page_title: initial.page_title || '', slug: initial.slug || '', content: initial.content || '', meta_title: initial.meta_title || '', meta_description: initial.meta_description || '',
      })
    } else {
      setFormData({
        page_title: '', slug: '', content: '', meta_title: '', meta_description: '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="page_title">Page Title *</Label>
        <Input id="page_title" value={formData.page_title} onChange={(e) => setFormData({ ...formData, page_title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input id="slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
      </div>
      <div>
        <Label htmlFor="meta_title">Meta Title</Label>
        <Input id="meta_title" value={formData.meta_title} onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="meta_description">Meta Description</Label>
        <Textarea id="meta_description" value={formData.meta_description} onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })} placeholder="Meta description for SEO..." rows={2} />
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Page content..." rows={6} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
