// ====================================================================
// Module: Hostel
// Page: Hostel Rooms
//
// Purpose:
// Manage hostel rooms.
//
// Data Source:
// hostel.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { DoorOpen, Plus, Eye, Pencil, Trash2, Building2, BedDouble } from 'lucide-react'
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
  { key: 'hostel_name', label: 'Hostel' },
  { key: 'room_type_name', label: 'Room Type' },
  { key: 'room_no', label: 'Room Number' },
  { key: 'floor', label: 'Floor' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'createdAt', label: 'Created At' },
]

export default function HostelRoomsPage() {
  const { toast } = useToast()
  const { data: hostelRooms, isLoading, refetch } = useAsyncData(() => hostelService.getHostelRooms(), [])
  const { data: hostels, isLoading: hostelsLoading } = useAsyncData(() => hostelService.getHostels(), [])
  const { data: roomTypes, isLoading: roomTypesLoading } = useAsyncData(() => hostelService.getRoomTypes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = hostelRooms || []
  const allHostels = hostels || []
  const allRoomTypes = roomTypes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const hostel = allHostels.find(h => h._id === r.hostel_id)
    const roomType = allRoomTypes.find(rt => rt._id === r.room_type_id)
    return !q || 
      (hostel?.hostel_name || '').toLowerCase().includes(q) ||
      (roomType?.room_type_name || '').toLowerCase().includes(q) ||
      (r.room_no || '').toLowerCase().includes(q)
  }), [rows, search, allHostels, allRoomTypes])

  const stats = useMemo(() => ({
    total: rows.length,
    totalCapacity: rows.reduce((sum, r) => sum + (r.capacity || 0), 0),
    totalOccupied: rows.reduce((sum, r) => sum + (r.occupied || 0), 0),
    available: rows.reduce((sum, r) => sum + ((r.capacity || 0) - (r.occupied || 0)), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'room_no',
      header: 'Room',
      cell: ({ row }) => (
        <button className="flex flex-col text-left" onClick={() => setViewRow(row.original)}>
          <span className="font-medium hover:underline">{row.original.room_no || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground">Floor {row.original.floor || '—'}</span>
        </button>
      ),
    },
    {
      accessorKey: 'hostel_id',
      header: 'Hostel',
      cell: ({ row }) => {
        const hostel = allHostels.find(h => h._id === row.original.hostel_id)
        return hostel?.hostel_name || 'Unknown'
      },
    },
    {
      accessorKey: 'room_type_id',
      header: 'Room Type',
      cell: ({ row }) => {
        const roomType = allRoomTypes.find(rt => rt._id === row.original.room_type_id)
        return roomType?.room_type_name || 'Unknown'
      },
    },
    { accessorKey: 'capacity', header: 'Capacity', cell: ({ row }) => `${row.original.capacity || 0} beds` },
    { accessorKey: 'occupied', header: 'Occupied', cell: ({ row }) => `${row.original.occupied || 0} beds` },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allHostels, allRoomTypes])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hostelService.updateHostelRoom(id, payload)
        toast({ title: 'Room updated successfully' })
        setEditRow(null)
      } else {
        await hostelService.createHostelRoom(payload)
        toast({ title: 'Room created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save room:', error)
      toast({ title: 'Failed to save room', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hostelService.deleteHostelRoom(id)
      toast({ title: 'Room deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete room:', error)
      toast({ title: 'Failed to delete room', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Hostel' }, { label: 'Hostel Rooms' }]} />
      <PageHeader
        title="Hostel Rooms"
        description="Manage hostel rooms and occupancy."
        icon={DoorOpen}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Room</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Rooms" value={stats.total} icon={DoorOpen} accent="primary" />
        <StatCard label="Total Capacity" value={`${stats.totalCapacity} beds`} icon={BedDouble} accent="success" />
        <StatCard label="Occupied" value={`${stats.totalOccupied} beds`} icon={Building2} accent="warning" />
        <StatCard label="Available" value={`${stats.available} beds`} icon={DoorOpen} accent="chart2" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by hostel, room type, or room number…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              hostel_name: allHostels.find(h => h._id === r.hostel_id)?.hostel_name || 'Unknown',
              room_type_name: allRoomTypes.find(rt => rt._id === r.room_type_id)?.room_type_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="hostel-rooms" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No rooms found" description="Add a room to get started." actionLabel="Add Room" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Room' : 'Add Room'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update room details' : 'Add a new room'}</DialogDescription>
          </DialogHeader>
          <HostelRoomForm 
            initial={editRow} 
            hostels={allHostels}
            roomTypes={allRoomTypes}
            hostelsLoading={hostelsLoading}
            roomTypesLoading={roomTypesLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Room Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const hostel = allHostels.find(h => h._id === viewRow.hostel_id)
          const roomType = allRoomTypes.find(rt => rt._id === viewRow.room_type_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Room Number', value: viewRow.room_no || 'Unknown' },
                { label: 'Hostel', value: hostel?.hostel_name || 'Unknown' },
                { label: 'Room Type', value: roomType?.room_type_name || 'Unknown' },
                { label: 'Floor', value: viewRow.floor || '—' },
                { label: 'Capacity', value: `${viewRow.capacity || 0} beds` },
                { label: 'Occupied', value: `${viewRow.occupied || 0} beds` },
                { label: 'Available', value: `${(viewRow.capacity || 0) - (viewRow.occupied || 0)} beds` },
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
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>Are you sure you want to delete this room? This action cannot be undone.</DialogDescription>
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

function HostelRoomForm({ initial, hostels, roomTypes, hostelsLoading, roomTypesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    hostel_id: '',
    room_type_id: '',
    room_no: '',
    floor: '',
    capacity: '',
    occupied: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        hostel_id: initial.hostel_id || '',
        room_type_id: initial.room_type_id || '',
        room_no: initial.room_no || '',
        floor: initial.floor || '',
        capacity: initial.capacity || '',
        occupied: initial.occupied || '',
      })
    } else {
      setFormData({
        hostel_id: hostels[0]?._id || '',
        room_type_id: roomTypes[0]?._id || '',
        room_no: '',
        floor: '',
        capacity: '',
        occupied: '0',
      })
    }
  }, [initial, hostels, roomTypes])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      capacity: Number(formData.capacity) || 0,
      occupied: Number(formData.occupied) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="hostel_id">Hostel *</Label>
        <select
          id="hostel_id"
          value={formData.hostel_id}
          onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
          disabled={hostelsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select hostel</option>
          {hostels.map((h) => (
            <option key={h._id} value={h._id}>{h.hostel_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="room_type_id">Room Type *</Label>
        <select
          id="room_type_id"
          value={formData.room_type_id}
          onChange={(e) => setFormData({ ...formData, room_type_id: e.target.value })}
          disabled={roomTypesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select room type</option>
          {roomTypes.map((rt) => (
            <option key={rt._id} value={rt._id}>{rt.room_type_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="room_no">Room Number *</Label>
        <Input
          id="room_no"
          value={formData.room_no}
          onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="floor">Floor</Label>
        <Input
          id="floor"
          value={formData.floor}
          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
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
        <Label htmlFor="occupied">Occupied</Label>
        <Input
          id="occupied"
          type="number"
          min="0"
          value={formData.occupied}
          onChange={(e) => setFormData({ ...formData, occupied: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
