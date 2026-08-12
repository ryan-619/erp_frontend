// ====================================================================
// Module: Hostel
// Page: Hostel List
//
// Purpose:
// Manage hostels.
//
// Data Source:
// hostel.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Building2, Plus, Eye, Pencil, Trash2, Phone, User } from 'lucide-react'
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
  { key: 'hostel_name', label: 'Hostel Name' },
  { key: 'type', label: 'Type' },
  { key: 'warden_name', label: 'Warden' },
  { key: 'warden_phone', label: 'Warden Phone' },
  { key: 'createdAt', label: 'Created At' },
]

export default function HostelListPage() {
  const { toast } = useToast()
  const { data: hostels, isLoading, refetch } = useAsyncData(() => hostelService.getHostels(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = hostels || []
  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.hostel_name || '').toLowerCase().includes(q) ||
      (r.type || '').toLowerCase().includes(q) ||
      (r.warden_name || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    boys: rows.filter(r => r.type === 'boys').length,
    girls: rows.filter(r => r.type === 'girls').length,
    coed: rows.filter(r => r.type === 'co-ed').length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'hostel_name',
      header: 'Hostel Name',
      cell: ({ row }) => (
        <button className="flex flex-col text-left" onClick={() => setViewRow(row.original)}>
          <span className="font-medium hover:underline">{row.original.hostel_name || 'Unnamed'}</span>
          <span className="text-xs text-muted-foreground capitalize">{row.original.type || '—'}</span>
        </button>
      ),
    },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <span className="capitalize">{row.original.type || '—'}</span> },
    { accessorKey: 'warden_name', header: 'Warden', cell: ({ row }) => row.original.warden_name || <span className="text-muted-foreground">Unassigned</span> },
    { accessorKey: 'warden_phone', header: 'Phone', cell: ({ row }) => row.original.warden_phone || '—' },
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
        await hostelService.updateHostel(id, payload)
        toast({ title: 'Hostel updated successfully' })
        setEditRow(null)
      } else {
        await hostelService.createHostel(payload)
        toast({ title: 'Hostel created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save hostel:', error)
      toast({ title: 'Failed to save hostel', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hostelService.deleteHostel(id)
      toast({ title: 'Hostel deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete hostel:', error)
      toast({ title: 'Failed to delete hostel', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Hostel' }, { label: 'Hostels' }]} />
      <PageHeader
        title="Hostels"
        description="Manage hostels and warden information."
        icon={Building2}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Hostel</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Hostels" value={stats.total} icon={Building2} accent="primary" />
        <StatCard label="Boys Hostels" value={stats.boys} icon={User} accent="blue" />
        <StatCard label="Girls Hostels" value={stats.girls} icon={User} accent="pink" />
        <StatCard label="Co-Ed Hostels" value={stats.coed} icon={Building2} accent="purple" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by hostel name, type, or warden…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="hostels" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No hostels found" description="Add a hostel to get started." actionLabel="Add Hostel" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Hostel' : 'Add Hostel'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update hostel details' : 'Add a new hostel'}</DialogDescription>
          </DialogHeader>
          <HostelForm 
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
        title="Hostel Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Hostel Name', value: viewRow.hostel_name || 'Unnamed' },
              { label: 'Type', value: viewRow.type ? viewRow.type.charAt(0).toUpperCase() + viewRow.type.slice(1) : '—' },
              { label: 'Warden Name', value: viewRow.warden_name || 'Unassigned' },
              { label: 'Warden Phone', value: viewRow.warden_phone || '—' },
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
            <DialogTitle>Delete Hostel</DialogTitle>
            <DialogDescription>Are you sure you want to delete this hostel? This action cannot be undone.</DialogDescription>
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

function HostelForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    hostel_name: '',
    type: 'boys',
    warden_name: '',
    warden_phone: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        hostel_name: initial.hostel_name || '',
        type: initial.type || 'boys',
        warden_name: initial.warden_name || '',
        warden_phone: initial.warden_phone || '',
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
        <Label htmlFor="hostel_name">Hostel Name *</Label>
        <Input
          id="hostel_name"
          value={formData.hostel_name}
          onChange={(e) => setFormData({ ...formData, hostel_name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="type">Type *</Label>
        <select
          id="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="boys">Boys</option>
          <option value="girls">Girls</option>
          <option value="co-ed">Co-Ed</option>
        </select>
      </div>
      <div>
        <Label htmlFor="warden_name">Warden Name</Label>
        <Input
          id="warden_name"
          value={formData.warden_name}
          onChange={(e) => setFormData({ ...formData, warden_name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="warden_phone">Warden Phone</Label>
        <Input
          id="warden_phone"
          value={formData.warden_phone}
          onChange={(e) => setFormData({ ...formData, warden_phone: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
