// ====================================================================
// Module: Inventory
// Page: Item Category
//
// Purpose:
// Manage inventory item categories.
//
// Data Source:
// inventory.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Tag, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { inventoryService } from '@/services/inventory.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'category_name', label: 'Category Name' },
  { key: 'createdAt', label: 'Created At' },
]

export default function ItemCategoryPage() {
  const { toast } = useToast()
  const { data: categories, isLoading, refetch } = useAsyncData(() => inventoryService.getItemCategories(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = categories || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || (r.category_name || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </div>
          <span className="font-medium hover:underline">{row.original.category_name || 'Unnamed'}</span>
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

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await inventoryService.updateItemCategory(id, payload)
        toast({ title: 'Category updated successfully' })
        setEditRow(null)
      } else {
        await inventoryService.createItemCategory(payload)
        toast({ title: 'Category created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save category:', error)
      toast({ title: 'Failed to save category', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await inventoryService.deleteItemCategory(id)
      toast({ title: 'Category deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete category:', error)
      toast({ title: 'Failed to delete category', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Inventory' }, { label: 'Item Category' }]} />
      <PageHeader
        title="Item Categories"
        description="Manage inventory item categories."
        icon={Tag}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Categories" value={stats.total} icon={Tag} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by category name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="item-categories" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={2} />
      ) : filtered.length === 0 ? (
        <NoData title="No categories found" description="Add a category to get started." actionLabel="Add Category" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update category details' : 'Add a new category'}</DialogDescription>
          </DialogHeader>
          <ItemCategoryForm 
            initial={editRow} 
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Category Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Category Name', value: viewRow.category_name || 'Unnamed' },
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
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure you want to delete this category? This action cannot be undone.</DialogDescription>
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

function ItemCategoryForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    category_name: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        category_name: initial.category_name || '',
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
        <Label htmlFor="category_name">Category Name *</Label>
        <Input
          id="category_name"
          value={formData.category_name}
          onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
