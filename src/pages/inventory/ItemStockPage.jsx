// ====================================================================
// Module: Inventory
// Page: Item Stock
//
// Purpose:
// Manage item stock.
//
// Data Source:
// inventory.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { ShoppingCart, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { inventoryService } from '@/services/inventory.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'item_name', label: 'Item' },
  { key: 'store_name', label: 'Store' },
  { key: 'supplier_name', label: 'Supplier' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit_price', label: 'Unit Price' },
  { key: 'date', label: 'Date' },
  { key: 'invoice_number', label: 'Invoice No' },
  { key: 'createdAt', label: 'Created At' },
]

export default function ItemStockPage() {
  const { toast } = useToast()
  const { data: itemStocks, isLoading, refetch } = useAsyncData(() => inventoryService.getItemStocks(), [])
  const { data: items, isLoading: itemsLoading } = useAsyncData(() => inventoryService.getItems(), [])
  const { data: stores, isLoading: storesLoading } = useAsyncData(() => inventoryService.getItemStores(), [])
  const { data: suppliers, isLoading: suppliersLoading } = useAsyncData(() => inventoryService.getItemSuppliers(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = itemStocks || []
  const allItems = items || []
  const allStores = stores || []
  const allSuppliers = suppliers || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const item = allItems.find(i => i._id === r.item_id)
    const store = allStores.find(s => s._id === r.store_id)
    const supplier = allSuppliers.find(s => s._id === r.supplier_id)
    return !q || 
      (item?.item_name || '').toLowerCase().includes(q) ||
      (store?.store_name || '').toLowerCase().includes(q) ||
      (supplier?.supplier_name || '').toLowerCase().includes(q) ||
      (r.invoice_number || '').toLowerCase().includes(q)
  }), [rows, search, allItems, allStores, allSuppliers])

  const stats = useMemo(() => ({
    total: rows.length,
    totalQuantity: rows.reduce((sum, r) => sum + (r.quantity || 0), 0),
    totalValue: rows.reduce((sum, r) => sum + ((r.quantity || 0) * (r.unit_price || 0)), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'item_id',
      header: 'Item',
      cell: ({ row }) => {
        const item = allItems.find(i => i._id === row.original.item_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{item?.item_name || 'Unknown'}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'store_id',
      header: 'Store',
      cell: ({ row }) => {
        const store = allStores.find(s => s._id === row.original.store_id)
        return <Badge variant="secondary">{store?.store_name || 'Unknown'}</Badge>
      },
    },
    {
      accessorKey: 'supplier_id',
      header: 'Supplier',
      cell: ({ row }) => {
        const supplier = allSuppliers.find(s => s._id === row.original.supplier_id)
        return <Badge variant="outline">{supplier?.supplier_name || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'quantity', header: 'Quantity', cell: ({ row }) => `${row.original.quantity || 0}` },
    { accessorKey: 'unit_price', header: 'Unit Price', cell: ({ row }) => `$${(row.original.unit_price || 0).toFixed(2)}` },
    { accessorKey: 'invoice_number', header: 'Invoice', cell: ({ row }) => row.original.invoice_number || '—' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allItems, allStores, allSuppliers])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await inventoryService.updateItemStock(id, payload)
        toast({ title: 'Stock updated successfully' })
        setEditRow(null)
      } else {
        await inventoryService.createItemStock(payload)
        toast({ title: 'Stock created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save stock:', error)
      toast({ title: 'Failed to save stock', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await inventoryService.deleteItemStock(id)
      toast({ title: 'Stock deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete stock:', error)
      toast({ title: 'Failed to delete stock', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Inventory' }, { label: 'Item Stock' }]} />
      <PageHeader
        title="Item Stock"
        description="Manage item stock levels."
        icon={ShoppingCart}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Stock</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Stock Records" value={stats.total} icon={ShoppingCart} accent="primary" />
        <StatCard label="Total Quantity" value={stats.totalQuantity} icon={ShoppingCart} accent="success" />
        <StatCard label="Total Value" value={`$${stats.totalValue.toFixed(2)}`} icon={ShoppingCart} accent="chart2" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by item, store, supplier, or invoice…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              item_name: allItems.find(i => i._id === r.item_id)?.item_name || 'Unknown',
              store_name: allStores.find(s => s._id === r.store_id)?.store_name || 'Unknown',
              supplier_name: allSuppliers.find(s => s._id === r.supplier_id)?.supplier_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="item-stock" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={8} />
      ) : filtered.length === 0 ? (
        <NoData title="No stock records found" description="Add stock to get started." actionLabel="Add Stock" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Stock' : 'Add Stock'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update stock details' : 'Add new stock'}</DialogDescription>
          </DialogHeader>
          <ItemStockForm 
            initial={editRow} 
            items={allItems}
            stores={allStores}
            suppliers={allSuppliers}
            itemsLoading={itemsLoading}
            storesLoading={storesLoading}
            suppliersLoading={suppliersLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Stock Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const item = allItems.find(i => i._id === viewRow.item_id)
          const store = allStores.find(s => s._id === viewRow.store_id)
          const supplier = allSuppliers.find(s => s._id === viewRow.supplier_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Item', value: item?.item_name || 'Unknown' },
                { label: 'Store', value: store?.store_name || 'Unknown' },
                { label: 'Supplier', value: supplier?.supplier_name || 'Unknown' },
                { label: 'Quantity', value: viewRow.quantity || 0 },
                { label: 'Unit Price', value: `$${(viewRow.unit_price || 0).toFixed(2)}` },
                { label: 'Total Value', value: `$${((viewRow.quantity || 0) * (viewRow.unit_price || 0)).toFixed(2)}` },
                { label: 'Invoice Number', value: viewRow.invoice_number || '—' },
                { label: 'Date', value: formatDate(viewRow.date) },
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
            <DialogTitle>Delete Stock</DialogTitle>
            <DialogDescription>Are you sure you want to delete this stock record? This action cannot be undone.</DialogDescription>
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

function ItemStockForm({ initial, items, stores, suppliers, itemsLoading, storesLoading, suppliersLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    item_id: '',
    store_id: '',
    supplier_id: '',
    quantity: '',
    unit_price: '',
    date: '',
    invoice_number: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        item_id: initial.item_id || '',
        store_id: initial.store_id || '',
        supplier_id: initial.supplier_id || '',
        quantity: initial.quantity || '',
        unit_price: initial.unit_price || '',
        date: initial.date ? initial.date.split('T')[0] : '',
        invoice_number: initial.invoice_number || '',
      })
    } else {
      setFormData({
        item_id: items[0]?._id || '',
        store_id: stores[0]?._id || '',
        supplier_id: suppliers[0]?._id || '',
        quantity: '',
        unit_price: '',
        date: new Date().toISOString().split('T')[0],
        invoice_number: '',
      })
    }
  }, [initial, items, stores, suppliers])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      quantity: Number(formData.quantity) || 0,
      unit_price: Number(formData.unit_price) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item_id">Item *</Label>
        <select
          id="item_id"
          value={formData.item_id}
          onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
          disabled={itemsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select item</option>
          {items.map((i) => (
            <option key={i._id} value={i._id}>{i.item_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="store_id">Store *</Label>
        <select
          id="store_id"
          value={formData.store_id}
          onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
          disabled={storesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select store</option>
          {stores.map((s) => (
            <option key={s._id} value={s._id}>{s.store_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="supplier_id">Supplier *</Label>
        <select
          id="supplier_id"
          value={formData.supplier_id}
          onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
          disabled={suppliersLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select supplier</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s._id}>{s.supplier_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="quantity">Quantity *</Label>
        <Input
          id="quantity"
          type="number"
          min="0"
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="unit_price">Unit Price *</Label>
        <Input
          id="unit_price"
          type="number"
          min="0"
          step="0.01"
          value={formData.unit_price}
          onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="invoice_number">Invoice Number</Label>
        <Input
          id="invoice_number"
          value={formData.invoice_number}
          onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
