// ====================================================================
// Module: Transport
// Page: Assign Pickup Point (Route Pickup Point)
//
// Purpose:
// Assign pickup points to transport routes.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Link, Plus, Eye, Pencil, Trash2, MapPin, Route as RouteIcon, ArrowUp, ArrowDown } from 'lucide-react'
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
import { transportService } from '@/services/transport.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'route_name', label: 'Route' },
  { key: 'point_name', label: 'Pickup Point' },
  { key: 'order', label: 'Order' },
  { key: 'createdAt', label: 'Created At' },
]

export default function AssignPickupPointPage() {
  const { toast } = useToast()
  const { data: routePickupPoints, isLoading, refetch } = useAsyncData(() => transportService.getRoutePickupPoints(), [])
  const { data: routes, isLoading: routesLoading } = useAsyncData(() => transportService.getTransportRoutes(), [])
  const { data: pickupPoints, isLoading: pickupPointsLoading } = useAsyncData(() => transportService.getPickupPoints(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = routePickupPoints || []
  const allRoutes = routes || []
  const allPickupPoints = pickupPoints || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const route = allRoutes.find(rt => rt._id === r.route_id)
    const point = allPickupPoints.find(p => p._id === r.pickup_point_id)
    return !q || 
      (route?.route_name || '').toLowerCase().includes(q) ||
      (point?.point_name || '').toLowerCase().includes(q)
  }), [rows, search, allRoutes, allPickupPoints])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'route_id',
      header: 'Route',
      cell: ({ row }) => {
        const route = allRoutes.find(r => r._id === row.original.route_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              <RouteIcon className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{route?.route_name || 'Unknown'}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'pickup_point_id',
      header: 'Pickup Point',
      cell: ({ row }) => {
        const point = allPickupPoints.find(p => p._id === row.original.pickup_point_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="font-medium">{point?.point_name || 'Unknown'}</span>
          </div>
        )
      },
    },
    { accessorKey: 'order', header: 'Order', cell: ({ row }) => <Badge variant="outline">{row.original.order || 0}</Badge> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allRoutes, allPickupPoints])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await transportService.updateRoutePickupPoint(id, payload)
        toast({ title: 'Assignment updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createRoutePickupPoint(payload)
        toast({ title: 'Assignment created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save assignment:', error)
      toast({ title: 'Failed to save assignment', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await transportService.deleteRoutePickupPoint(id)
      toast({ title: 'Assignment deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      toast({ title: 'Failed to delete assignment', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Assign Pickup Point' }]} />
      <PageHeader
        title="Assign Pickup Point"
        description="Assign pickup points to transport routes."
        icon={Link}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Assignment</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Assignments" value={stats.total} icon={Link} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by route or pickup point…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              route_name: allRoutes.find(rt => rt._id === r.route_id)?.route_name || 'Unknown',
              point_name: allPickupPoints.find(p => p._id === r.pickup_point_id)?.point_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="assign-pickup-points" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No assignments found" description="Assign a pickup point to a route to get started." actionLabel="Add Assignment" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Assignment' : 'Assign Pickup Point'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update pickup point assignment' : 'Assign a pickup point to a route'}</DialogDescription>
          </DialogHeader>
          <RoutePickupPointForm 
            initial={editRow} 
            routes={allRoutes}
            pickupPoints={allPickupPoints}
            routesLoading={routesLoading}
            pickupPointsLoading={pickupPointsLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Assignment Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const route = allRoutes.find(r => r._id === viewRow.route_id)
          const point = allPickupPoints.find(p => p._id === viewRow.pickup_point_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Route', value: route?.route_name || 'Unknown' },
                { label: 'Pickup Point', value: point?.point_name || 'Unknown' },
                { label: 'Pickup Time', value: point?.pickup_time || '—' },
                { label: 'Order', value: viewRow.order || 0 },
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
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this assignment? This action cannot be undone.</DialogDescription>
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

function RoutePickupPointForm({ initial, routes, pickupPoints, routesLoading, pickupPointsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    route_id: '',
    pickup_point_id: '',
    order: 0,
  })

  useState(() => {
    if (initial) {
      setFormData({
        route_id: initial.route_id || '',
        pickup_point_id: initial.pickup_point_id || '',
        order: initial.order || 0,
      })
    } else {
      setFormData({
        route_id: routes[0]?._id || '',
        pickup_point_id: pickupPoints[0]?._id || '',
        order: 0,
      })
    }
  }, [initial, routes, pickupPoints])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      order: Number(formData.order) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="route_id">Route *</Label>
        <select
          id="route_id"
          value={formData.route_id}
          onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
          disabled={routesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select route</option>
          {routes.map((r) => (
            <option key={r._id} value={r._id}>{r.route_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="pickup_point_id">Pickup Point *</Label>
        <select
          id="pickup_point_id"
          value={formData.pickup_point_id}
          onChange={(e) => setFormData({ ...formData, pickup_point_id: e.target.value })}
          disabled={pickupPointsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select pickup point</option>
          {pickupPoints.map((p) => (
            <option key={p._id} value={p._id}>{p.point_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="order">Order</Label>
        <Input
          id="order"
          type="number"
          min="0"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
