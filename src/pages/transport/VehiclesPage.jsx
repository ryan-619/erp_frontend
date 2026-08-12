// ====================================================================
// Module: Transport
// Page: Vehicles
//
// Purpose:
// Manage transport vehicles.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Truck, Plus, Eye, Pencil, Trash2, Phone, User } from 'lucide-react'
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
  { key: 'vehicle_number', label: 'Vehicle Number' },
  { key: 'type', label: 'Type' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'driver_name', label: 'Driver' },
  { key: 'driver_phone', label: 'Driver Phone' },
  { key: 'createdAt', label: 'Created At' },
]

export default function VehiclesPage() {
  const { toast } = useToast()
  const { data: vehicles, isLoading, refetch } = useAsyncData(() => transportService.getVehicles(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = vehicles || []
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.vehicle_number || '').toLowerCase().includes(q) ||
      (r.type || '').toLowerCase().includes(q) ||
      (r.driver_name || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    totalCapacity: rows.reduce((sum, r) => sum + (r.capacity || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'vehicle_number',
      header: 'Vehicle',
      cell: ({ row }) => (
        <button className="flex flex-col text-left" onClick={() => setViewRow(row.original)}>
          <span className="font-medium hover:underline">{row.original.vehicle_number || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">{row.original.type || '—'}</span>
        </button>
      ),
    },
    { accessorKey: 'capacity', header: 'Capacity', cell: ({ row }) => `${row.original.capacity || 0} seats` },
    { accessorKey: 'driver_name', header: 'Driver', cell: ({ row }) => row.original.driver_name || <span className="text-muted-foreground">Unassigned</span> },
    { accessorKey: 'driver_phone', header: 'Phone', cell: ({ row }) => row.original.driver_phone || '—' },
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
        await transportService.updateVehicle(id, payload)
        toast({ title: 'Vehicle updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createVehicle(payload)
        toast({ title: 'Vehicle created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save vehicle:', error)
      toast({ title: 'Failed to save vehicle', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await transportService.deleteVehicle(id)
      toast({ title: 'Vehicle deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete vehicle:', error)
      toast({ title: 'Failed to delete vehicle', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Vehicles' }]} />
      <PageHeader
        title="Vehicles"
        description="Manage transport vehicles and drivers."
        icon={Truck}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Vehicles" value={stats.total} icon={Truck} accent="primary" />
        <StatCard label="Total Capacity" value={`${stats.totalCapacity} seats`} icon={User} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by vehicle number, type, or driver…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="vehicles" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No vehicles found" description="Add a vehicle to get started." actionLabel="Add Vehicle" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update vehicle details' : 'Add a new vehicle to the fleet'}</DialogDescription>
          </DialogHeader>
          <VehicleForm 
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
        title="Vehicle Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Vehicle Number', value: viewRow.vehicle_number || 'Unknown' },
              { label: 'Type', value: viewRow.type || '—' },
              { label: 'Capacity', value: `${viewRow.capacity || 0} seats` },
              { label: 'Driver Name', value: viewRow.driver_name || 'Unassigned' },
              { label: 'Driver Phone', value: viewRow.driver_phone || '—' },
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
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>Are you sure you want to delete this vehicle? This action cannot be undone.</DialogDescription>
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

function VehicleForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: '',
    capacity: '',
    driver_name: '',
    driver_phone: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        vehicle_number: initial.vehicle_number || '',
        type: initial.type || '',
        capacity: initial.capacity || '',
        driver_name: initial.driver_name || '',
        driver_phone: initial.driver_phone || '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      capacity: Number(formData.capacity) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="vehicle_number">Vehicle Number *</Label>
        <Input
          id="vehicle_number"
          value={formData.vehicle_number}
          onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Type *</Label>
        <Input
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          placeholder="e.g., Bus, Van, Mini Bus"
          required
        />
      </div>
      <div>
        <Label htmlFor="capacity">Capacity *</Label>
        <Input
          id="capacity"
          type="number"
          min="0"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="driver_name">Driver Name</Label>
        <Input
          id="driver_name"
          value={formData.driver_name}
          onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="driver_phone">Driver Phone</Label>
        <Input
          id="driver_phone"
          value={formData.driver_phone}
          onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
