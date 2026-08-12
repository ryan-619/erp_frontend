// ====================================================================
// Module: Inventory
// Page: Items
//
// Purpose:
// Manage inventory items.
//
// Data Source:
// inventory.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Box, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { inventoryService } from '@/services/inventory.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'item_name', label: 'Item Name' },
  { key: 'category_name', label: 'Category' },
  { key: 'unit', label: 'Unit' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created At' },
]

export default function ItemsPage() {
  const { toast } = useToast()
  const { data: items, isLoading, refetch } = useAsyncData(() => inventoryService.getItems(), [])
  const { data: categories, isLoading: categoriesLoading } = useAsyncData(() => inventoryService.getItemCategories(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = items || []
  const allCategories = categories || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const category = allCategories.find(c => c._id === r.category_id)
    return !q || 
      (r.item_name || '').toLowerCase().includes(q) ||
      (category?.category_name || '').toLowerCase().includes(q) ||
      (r.unit || '').toLowerCase().includes(q)
  }), [rows, search, allCategories])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'item_name',
      header: 'Item',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Box className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.item_name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.unit || '—'}</span>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'category_id',
      header: 'Category',
      cell: ({ row }) => {
        const category = allCategories.find(c => c._id === row.original.category_id)
        return <Badge variant="secondary">{category?.category_name || 'Uncategorized'}</Badge>
      },
    },
    { accessorKey: 'unit', header: 'Unit', cell: ({ row }) => <Badge variant="outline">{row.original.unit || '—'}</Badge> },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allCategories])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await inventoryService.updateItem(id, payload)
        toast({ title: 'Item updated successfully' })
        setEditRow(null)
      } else {
        await inventoryService.createItem(payload)
        toast({ title: 'Item created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save item:', error)
      toast({ title: 'Failed to save item', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await inventoryService.deleteItem(id)
      toast({ title: 'Item deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast({ title: 'Failed to delete item', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Inventory' }, { label: 'Items' }]} />
      <PageHeader
        title="Items"
        description="Manage inventory items."
        icon={Box}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Items" value={stats.total} icon={Box} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by item name, category, or unit…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              category_name: allCategories.find(c => c._id === r.category_id)?.category_name || 'Uncategorized',
            }))} 
            columns={EXPORT_COLS} 
            filename="items" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No items found" description="Add an item to get started." actionLabel="Add Item" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Item' : 'Add Item'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update item details' : 'Add a new item'}</DialogDescription>
          </DialogHeader>
          <ItemForm 
            initial={editRow} 
            categories={allCategories}
            categoriesLoading={categoriesLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Item Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const category = allCategories.find(c => c._id === viewRow.category_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Item Name', value: viewRow.item_name || 'Unnamed' },
                { label: 'Category', value: category?.category_name || 'Uncategorized' },
                { label: 'Unit', value: viewRow.unit || '—' },
                { label: 'Description', value: viewRow.description || '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
                { label: 'Updated', value: formatDate(viewRow.updatedAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>Are you sure you want to delete this item? This action cannot be undone.</DialogDescription>
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

function ItemForm({ initial, categories, categoriesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    item_name: '',
    category_id: '',
    unit: '',
    description: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        item_name: initial.item_name || '',
        category_id: initial.category_id || '',
        unit: initial.unit || '',
        description: initial.description || '',
      })
    } else {
      setFormData({
        item_name: '',
        category_id: categories[0]?._id || '',
        unit: '',
        description: '',
      })
    }
  }, [initial, categories])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item_name">Item Name *</Label>
        <Input
          id="item_name"
          value={formData.item_name}
          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="category_id">Category *</Label>
        <select
          id="category_id"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          disabled={categoriesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.category_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="unit">Unit *</Label>
        <Input
          id="unit"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          placeholder="e.g., pcs, kg, liters"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Item description..."
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
