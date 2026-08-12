// ====================================================================
// Module: Transport
// Page: Assign Vehicle
//
// Purpose:
// Assign vehicles to transport routes.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Link, Plus, Eye, Pencil, Trash2, Truck, Route as RouteIcon } from 'lucide-react'
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
  { key: 'route_name', label: 'Route' },
  { key: 'vehicle_number', label: 'Vehicle' },
  { key: 'createdAt', label: 'Created At' },
]

export default function AssignVehiclePage() {
  const { toast } = useToast()
  const { data: assignVehicles, isLoading, refetch } = useAsyncData(() => transportService.getAssignVehicles(), [])
  const { data: routes, isLoading: routesLoading } = useAsyncData(() => transportService.getTransportRoutes(), [])
  const { data: vehicles, isLoading: vehiclesLoading } = useAsyncData(() => transportService.getVehicles(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = assignVehicles || []
  const allRoutes = routes || []
  const allVehicles = vehicles || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const route = allRoutes.find(rt => rt._id === r.route_id)
    const vehicle = allVehicles.find(v => v._id === r.vehicle_id)
    return !q || 
      (route?.route_name || '').toLowerCase().includes(q) ||
      (vehicle?.vehicle_number || '').toLowerCase().includes(q)
  }), [rows, search, allRoutes, allVehicles])

  const stats = useMemo(() => ({
    total: rows.length,
    assigned: rows.length,
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
      accessorKey: 'vehicle_id',
      header: 'Vehicle',
      cell: ({ row }) => {
        const vehicle = allVehicles.find(v => v._id === row.original.vehicle_id)
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10 text-sm font-bold text-success">
              <Truck className="h-4 w-4" />
            </div>
            <span className="font-medium">{vehicle?.vehicle_number || 'Unknown'}</span>
          </div>
        )
      },
    },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allRoutes, allVehicles])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await transportService.updateAssignVehicle(id, payload)
        toast({ title: 'Assignment updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createAssignVehicle(payload)
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
      await transportService.deleteAssignVehicle(id)
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Assign Vehicle' }]} />
      <PageHeader
        title="Assign Vehicle"
        description="Assign vehicles to transport routes."
        icon={Link}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Assignment</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Assignments" value={stats.total} icon={Link} accent="primary" />
        <StatCard label="Routes with Vehicle" value={stats.assigned} icon={Truck} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by route or vehicle…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              route_name: allRoutes.find(rt => rt._id === r.route_id)?.route_name || 'Unknown',
              vehicle_number: allVehicles.find(v => v._id === r.vehicle_id)?.vehicle_number || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="assign-vehicles" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No assignments found" description="Assign a vehicle to a route to get started." actionLabel="Add Assignment" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Assignment' : 'Assign Vehicle'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update vehicle assignment' : 'Assign a vehicle to a route'}</DialogDescription>
          </DialogHeader>
          <AssignVehicleForm 
            initial={editRow} 
            routes={allRoutes}
            vehicles={allVehicles}
            routesLoading={routesLoading}
            vehiclesLoading={vehiclesLoading}
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
          const vehicle = allVehicles.find(v => v._id === viewRow.vehicle_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Route', value: route?.route_name || 'Unknown' },
                { label: 'Vehicle', value: vehicle?.vehicle_number || 'Unknown' },
                { label: 'Vehicle Type', value: vehicle?.type || '—' },
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

function AssignVehicleForm({ initial, routes, vehicles, routesLoading, vehiclesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        route_id: initial.route_id || '',
        vehicle_id: initial.vehicle_id || '',
      })
    } else {
      setFormData({
        route_id: routes[0]?._id || '',
        vehicle_id: vehicles[0]?._id || '',
      })
    }
  }, [initial, routes, vehicles])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
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
        <Label htmlFor="vehicle_id">Vehicle *</Label>
        <select
          id="vehicle_id"
          value={formData.vehicle_id}
          onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
          disabled={vehiclesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v._id} value={v._id}>{v.vehicle_number || 'Unknown'} ({v.type || '—'})</option>
          ))}
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
