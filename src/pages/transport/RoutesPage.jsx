// ====================================================================
// Module: Transport
// Page: Routes
//
// Purpose:
// Manage transport routes.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Route as RouteIcon, Plus, Eye, Pencil, Trash2, MapPin } from 'lucide-react'
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
import { transportService } from '@/services/transport.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'route_name', label: 'Route Name' },
  { key: 'route_start', label: 'Start Point' },
  { key: 'route_end', label: 'End Point' },
  { key: 'createdAt', label: 'Created At' },
]

export default function RoutesPage() {
  const { toast } = useToast()
  const { data: routes, isLoading, refetch } = useAsyncData(() => transportService.getTransportRoutes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = routes || []
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.route_name || '').toLowerCase().includes(q) ||
      (r.route_start || '').toLowerCase().includes(q) ||
      (r.route_end || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'route_name',
      header: 'Route Name',
      cell: ({ row }) => (
        <button className="flex flex-col text-left" onClick={() => setViewRow(row.original)}>
          <span className="font-medium hover:underline">{row.original.route_name || 'Unnamed'}</span>
        </button>
      ),
    },
    { accessorKey: 'route_start', header: 'Start Point', cell: ({ row }) => row.original.route_start || '—' },
    { accessorKey: 'route_end', header: 'End Point', cell: ({ row }) => row.original.route_end || '—' },
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
        await transportService.updateTransportRoute(id, payload)
        toast({ title: 'Route updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createTransportRoute(payload)
        toast({ title: 'Route created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save route:', error)
      toast({ title: 'Failed to save route', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await transportService.deleteTransportRoute(id)
      toast({ title: 'Route deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete route:', error)
      toast({ title: 'Failed to delete route', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Routes' }]} />
      <PageHeader
        title="Routes"
        description="Manage transport routes."
        icon={RouteIcon}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Route</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Routes" value={stats.total} icon={RouteIcon} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by route name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="transport-routes" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No routes found" description="Create a new route to get started." actionLabel="Add Route" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Route' : 'Add Route'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update route details' : 'Create a new transport route'}</DialogDescription>
          </DialogHeader>
          <RouteForm 
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
        title="Route Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Route Name', value: viewRow.route_name || 'Unnamed' },
              { label: 'Start Point', value: viewRow.route_start || '—' },
              { label: 'End Point', value: viewRow.route_end || '—' },
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
            <DialogTitle>Delete Route</DialogTitle>
            <DialogDescription>Are you sure you want to delete this route? This action cannot be undone.</DialogDescription>
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

function RouteForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    route_name: '',
    route_start: '',
    route_end: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        route_name: initial.route_name || '',
        route_start: initial.route_start || '',
        route_end: initial.route_end || '',
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
        <Label htmlFor="route_name">Route Name *</Label>
        <Input
          id="route_name"
          value={formData.route_name}
          onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="route_start">Start Point *</Label>
        <Input
          id="route_start"
          value={formData.route_start}
          onChange={(e) => setFormData({ ...formData, route_start: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="route_end">End Point *</Label>
        <Input
          id="route_end"
          value={formData.route_end}
          onChange={(e) => setFormData({ ...formData, route_end: e.target.value })}
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
