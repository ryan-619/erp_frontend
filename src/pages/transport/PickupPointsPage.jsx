// ====================================================================
// Module: Transport
// Page: Pickup Points
//
// Purpose:
// Manage transport pickup points.
//
// Data Source:
// transport.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { MapPin, Plus, Eye, Pencil, Trash2, Clock } from 'lucide-react'
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
  { key: 'point_name', label: 'Point Name' },
  { key: 'pickup_time', label: 'Pickup Time' },
  { key: 'createdAt', label: 'Created At' },
]

export default function PickupPointsPage() {
  const { toast } = useToast()
  const { data: pickupPoints, isLoading, refetch } = useAsyncData(() => transportService.getPickupPoints(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = pickupPoints || []
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.point_name || '').toLowerCase().includes(q) ||
      (r.pickup_time || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'point_name',
      header: 'Pickup Point',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="font-medium hover:underline">{row.original.point_name || 'Unnamed'}</span>
        </button>
      ),
    },
    { accessorKey: 'pickup_time', header: 'Pickup Time', cell: ({ row }) => row.original.pickup_time || '—' },
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
        await transportService.updatePickupPoint(id, payload)
        toast({ title: 'Pickup point updated successfully' })
        setEditRow(null)
      } else {
        await transportService.createPickupPoint(payload)
        toast({ title: 'Pickup point created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save pickup point:', error)
      toast({ title: 'Failed to save pickup point', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await transportService.deletePickupPoint(id)
      toast({ title: 'Pickup point deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete pickup point:', error)
      toast({ title: 'Failed to delete pickup point', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Transport' }, { label: 'Pickup Points' }]} />
      <PageHeader
        title="Pickup Points"
        description="Manage transport pickup points and timings."
        icon={MapPin}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Pickup Point</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Pickup Points" value={stats.total} icon={MapPin} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by point name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="pickup-points" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No pickup points found" description="Add a pickup point to get started." actionLabel="Add Pickup Point" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Pickup Point' : 'Add Pickup Point'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update pickup point details' : 'Add a new pickup point'}</DialogDescription>
          </DialogHeader>
          <PickupPointForm 
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
        title="Pickup Point Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Point Name', value: viewRow.point_name || 'Unnamed' },
              { label: 'Pickup Time', value: viewRow.pickup_time || '—' },
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
            <DialogTitle>Delete Pickup Point</DialogTitle>
            <DialogDescription>Are you sure you want to delete this pickup point? This action cannot be undone.</DialogDescription>
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

function PickupPointForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    point_name: '',
    pickup_time: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        point_name: initial.point_name || '',
        pickup_time: initial.pickup_time || '',
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
        <Label htmlFor="point_name">Point Name *</Label>
        <Input
          id="point_name"
          value={formData.point_name}
          onChange={(e) => setFormData({ ...formData, point_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="pickup_time">Pickup Time</Label>
        <Input
          id="pickup_time"
          type="time"
          value={formData.pickup_time}
          onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
