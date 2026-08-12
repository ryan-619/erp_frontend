// ====================================================================
// Module: Library
// Page: Book List
//
// Purpose:
// Browse, search, and manage the library book catalog.
//
// Data Source:
// library.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { BookPlus, Eye, Pencil, Trash2, Printer, BookOpen, Library as LibraryIcon, CircleCheck as CheckCircle2, CircleX } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { libraryService } from '@/services/library.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'category', label: 'Category' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'available', label: 'Available' },
]

export default function BookListPage() {
  const { toast } = useToast()
  const { data: books, isLoading, refetch } = useAsyncData(() => libraryService.getBookList(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = books || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.title || '').toLowerCase().includes(q) ||
      (r.author || '').toLowerCase().includes(q) ||
      (r.isbn || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    totalTitles: rows.length,
    totalCopies: rows.reduce((s, r) => s + (r.quantity || 0), 0),
    available: rows.reduce((s, r) => s + (r.available || 0), 0),
    issued: rows.reduce((s, r) => s + ((r.quantity || 0) - (r.available || 0)), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Book',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.title}</span>
            <span className="text-xs text-muted-foreground">{row.original.author || '—'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'isbn', header: 'ISBN', cell: ({ row }) => <Badge variant="outline" className="font-mono text-xs">{row.original.isbn || '—'}</Badge> },
    { accessorKey: 'category', header: 'Category', cell: ({ row }) => <Badge variant="secondary">{row.original.category || '—'}</Badge> },
    { accessorKey: 'publisher', header: 'Publisher', cell: ({ row }) => row.original.publisher || '—' },
    { accessorKey: 'quantity', header: 'Total Copies', cell: ({ row }) => row.original.quantity || 0 },
    { accessorKey: 'available', header: 'Available', cell: ({ row }) => (
      <Badge variant={row.original.available > 0 ? 'default' : 'destructive'}>
        {row.original.available || 0}
      </Badge>
    ) },
    { accessorKey: 'createdAt', header: 'Added', cell: ({ row }) => formatDate(row.original.createdAt) },
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
        await libraryService.updateBook(id, payload)
        toast({ title: 'Book updated' })
      } else {
        await libraryService.createBook(payload)
        toast({ title: 'Book added' })
      }
      setAddOpen(false)
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save book:', error)
      toast({ title: 'Failed to save book', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await libraryService.deleteBook(id)
      toast({ title: 'Book deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete book:', error)
      toast({ title: 'Failed to delete book', variant: 'destructive' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Library' }, { label: 'Book List' }]} />
      <PageHeader
        title="Book List"
        description="Browse, search, and manage the library catalog."
        icon={BookOpen}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button onClick={() => setAddOpen(true)}><BookPlus className="mr-2 h-4 w-4" /> Add Book</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Titles" value={stats.totalTitles} icon={LibraryIcon} accent="primary" />
        <StatCard label="Total Copies" value={stats.totalCopies} icon={BookOpen} accent="chart2" />
        <StatCard label="Available" value={stats.available} icon={CheckCircle2} accent="success" />
        <StatCard label="Issued" value={stats.issued} icon={CircleX} accent="destructive" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, author, or ISBN…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="book-list" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <NoData title="No books found" description="Add a new book to get started." actionLabel="Add Book" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Book' : 'Add Book'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update book information' : 'Add a new book to the library'}</DialogDescription>
          </DialogHeader>
          <BookForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Book Details"
        description={viewRow?.title}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Title', value: viewRow.title },
              { label: 'Author', value: viewRow.author || '—' },
              { label: 'ISBN', value: viewRow.isbn || '—' },
              { label: 'Category', value: viewRow.category || '—' },
              { label: 'Publisher', value: viewRow.publisher || '—' },
              { label: 'Total Copies', value: viewRow.quantity || 0 },
              { label: 'Available', value: viewRow.available || 0 },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
              { label: 'Updated', value: formatDate(viewRow.updatedAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteRow?.title}"? This action cannot be undone.</DialogDescription>
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

// ─── BookForm Component ───────────────────────────────────────────────────────
function BookForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    quantity: 1,
    available: 1,
    publisher: '',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        title: initial.title || '',
        author: initial.author || '',
        isbn: initial.isbn || '',
        category: initial.category || '',
        quantity: initial.quantity || 1,
        available: initial.available || 1,
        publisher: initial.publisher || '',
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
        <Label htmlFor="title">Book Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter book title"
          required
        />
      </div>
      <div>
        <Label htmlFor="author">Author *</Label>
        <Input
          id="author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          placeholder="Enter author name"
          required
        />
      </div>
      <div>
        <Label htmlFor="isbn">ISBN</Label>
        <Input
          id="isbn"
          value={formData.isbn}
          onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
          placeholder="Enter ISBN"
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Fiction, Science, History"
        />
      </div>
      <div>
        <Label htmlFor="publisher">Publisher</Label>
        <Input
          id="publisher"
          value={formData.publisher}
          onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
          placeholder="Enter publisher name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Total Copies *</Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="available">Available Copies *</Label>
          <Input
            id="available"
            type="number"
            min="0"
            value={formData.available}
            onChange={(e) => setFormData({ ...formData, available: parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Book</Button>
      </DialogFooter>
    </form>
  )
}
