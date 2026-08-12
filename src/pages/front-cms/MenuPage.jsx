// ====================================================================
// Module: Front CMS
// Page: Menus
//
// Purpose:
// Manage navigation menus.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Menu, Eye, Pencil, Trash2 } from 'lucide-react'
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
  { key: 'menu_name', label: 'Menu Name' },
  { key: 'link', label: 'Link' },
  { key: 'menu_type', label: 'Menu Type' },
  { key: 'order', label: 'Order' },
  { key: 'createdAt', label: 'Created At' },
]

export default function MenuPage() {
  const { toast } = useToast()
  const { data: menus, isLoading, refetch } = useAsyncData(() => frontCmsService.getMenus(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = menus || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.menu_name || '').toLowerCase().includes(q) ||
      (r.link || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'menu_name',
      header: 'Menu',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Menu className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.menu_name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.menu_type || 'No type'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'link', header: 'Link', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.link || '—'}</span> },
    { accessorKey: 'order', header: 'Order', cell: ({ row }) => row.original.order || 0 },
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
        await frontCmsService.updateMenu(id, payload)
        toast({ title: 'Menu updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createMenu(payload)
        toast({ title: 'Menu created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save menu:', error)
      toast({ title: 'Failed to save menu', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontCmsService.deleteMenu(id)
      toast({ title: 'Menu deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete menu:', error)
      toast({ title: 'Failed to delete menu', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Menus' }]} />
      <PageHeader
        title="Menus"
        description="Manage navigation menus."
        icon={Menu}
        actions={<Button onClick={() => setAddOpen(true)}><Menu className="mr-2 h-4 w-4" /> Add Menu</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Menus" value={stats.total} icon={Menu} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or link…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="menus" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No menus found" description="Add a menu to get started." actionLabel="Add Menu" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Menu' : 'Add Menu'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update menu details' : 'Add a new navigation menu'}</DialogDescription>
          </DialogHeader>
          <MenuForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Menu Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Menu Name', value: viewRow.menu_name || '—' },
              { label: 'Link', value: viewRow.link || '—' },
              { label: 'Menu Type', value: viewRow.menu_type || '—' },
              { label: 'Parent ID', value: viewRow.parent_id || '—' },
              { label: 'Order', value: viewRow.order || 0 },
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
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>Are you sure you want to delete this menu? This action cannot be undone.</DialogDescription>
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

function MenuForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    menu_name: '', link: '', parent_id: '', order: 0, menu_type: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        menu_name: initial.menu_name || '', link: initial.link || '', parent_id: initial.parent_id || '', order: initial.order || 0, menu_type: initial.menu_type || '',
      })
    } else {
      setFormData({
        menu_name: '', link: '', parent_id: '', order: 0, menu_type: '',
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
        <Label htmlFor="menu_name">Menu Name *</Label>
        <Input id="menu_name" value={formData.menu_name} onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="link">Link *</Label>
        <Input id="link" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="menu_type">Menu Type</Label>
        <Input id="menu_type" value={formData.menu_type} onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })} placeholder="header, footer, etc." />
      </div>
      <div>
        <Label htmlFor="parent_id">Parent ID</Label>
        <Input id="parent_id" value={formData.parent_id} onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })} placeholder="Parent menu ID for nested menus" />
      </div>
      <div>
        <Label htmlFor="order">Order</Label>
        <Input id="order" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
