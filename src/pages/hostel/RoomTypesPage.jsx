// ====================================================================
// Module: Hostel
// Page: Room Types
//
// Purpose:
// Manage hostel room types.
//
// Data Source:
// hostel.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { BedDouble, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { hostelService } from '@/services/hostel.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'room_type_name', label: 'Room Type' },
  { key: 'beds', label: 'Beds' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'createdAt', label: 'Created At' },
]

export default function RoomTypesPage() {
  const { toast } = useToast()
  const { data: roomTypes, isLoading, refetch } = useAsyncData(() => hostelService.getRoomTypes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = roomTypes || []
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.room_type_name || '').toLowerCase().includes(q) ||
      (r.facilities || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    totalBeds: rows.reduce((sum, r) => sum + (r.beds || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'room_type_name',
      header: 'Room Type',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            <BedDouble className="h-4 w-4" />
          </div>
          <span className="font-medium hover:underline">{row.original.room_type_name || 'Unnamed'}</span>
        </button>
      ),
    },
    { accessorKey: 'beds', header: 'Beds', cell: ({ row }) => `${row.original.beds || 0} beds` },
    { accessorKey: 'facilities', header: 'Facilities', cell: ({ row }) => row.original.facilities || '—' },
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
        await hostelService.updateRoomType(id, payload)
        toast({ title: 'Room type updated successfully' })
        setEditRow(null)
      } else {
        await hostelService.createRoomType(payload)
        toast({ title: 'Room type created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save room type:', error)
      toast({ title: 'Failed to save room type', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hostelService.deleteRoomType(id)
      toast({ title: 'Room type deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete room type:', error)
      toast({ title: 'Failed to delete room type', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Hostel' }, { label: 'Room Types' }]} />
      <PageHeader
        title="Room Types"
        description="Manage hostel room types and facilities."
        icon={BedDouble}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Room Type</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Room Types" value={stats.total} icon={BedDouble} accent="primary" />
        <StatCard label="Total Beds" value={stats.totalBeds} icon={BedDouble} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by room type or facilities…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="room-types" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No room types found" description="Add a room type to get started." actionLabel="Add Room Type" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Room Type' : 'Add Room Type'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update room type details' : 'Add a new room type'}</DialogDescription>
          </DialogHeader>
          <RoomTypeForm 
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
        title="Room Type Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Room Type', value: viewRow.room_type_name || 'Unnamed' },
              { label: 'Beds', value: `${viewRow.beds || 0} beds` },
              { label: 'Facilities', value: viewRow.facilities || '—' },
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
            <DialogTitle>Delete Room Type</DialogTitle>
            <DialogDescription>Are you sure you want to delete this room type? This action cannot be undone.</DialogDescription>
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

function RoomTypeForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    room_type_name: '',
    beds: '',
    facilities: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        room_type_name: initial.room_type_name || '',
        beds: initial.beds || '',
        facilities: initial.facilities || '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      beds: Number(formData.beds) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="room_type_name">Room Type Name *</Label>
        <Input
          id="room_type_name"
          value={formData.room_type_name}
          onChange={(e) => setFormData({ ...formData, room_type_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="beds">Number of Beds *</Label>
        <Input
          id="beds"
          type="number"
          min="1"
          value={formData.beds}
          onChange={(e) => setFormData({ ...formData, beds: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="facilities">Facilities</Label>
        <Input
          id="facilities"
          value={formData.facilities}
          onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
          placeholder="e.g., AC, WiFi, Attached Bathroom"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
