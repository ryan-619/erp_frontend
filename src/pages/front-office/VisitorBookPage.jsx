// ====================================================================
// Module: Front Office
// Page: Visitor Book
//
// Purpose:
// Manage visitor records.
//
// Data Source:
// frontOffice.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Users, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { frontOfficeService } from '@/services/frontOffice.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'visitor_name', label: 'Visitor Name' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'meeting_with', label: 'Meeting With' },
  { key: 'in_time', label: 'In Time' },
  { key: 'out_time', label: 'Out Time' },
  { key: 'date', label: 'Date' },
]

export default function VisitorBookPage() {
  const { toast } = useToast()
  const { data: visitors, isLoading, refetch } = useAsyncData(() => frontOfficeService.getVisitors(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = visitors || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.visitor_name || '').toLowerCase().includes(q) ||
      (r.purpose || '').toLowerCase().includes(q) ||
      (r.meeting_with || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'visitor_name',
      header: 'Visitor',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.visitor_name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{row.original.purpose || 'No purpose'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'meeting_with', header: 'Meeting With', cell: ({ row }) => row.original.meeting_with || '—' },
    { accessorKey: 'in_time', header: 'In Time', cell: ({ row }) => row.original.in_time || '—' },
    { accessorKey: 'out_time', header: 'Out Time', cell: ({ row }) => row.original.out_time || '—' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
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
        await frontOfficeService.updateVisitor(id, payload)
        toast({ title: 'Visitor updated successfully' })
        setEditRow(null)
      } else {
        await frontOfficeService.createVisitor(payload)
        toast({ title: 'Visitor created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save visitor:', error)
      toast({ title: 'Failed to save visitor', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontOfficeService.deleteVisitor(id)
      toast({ title: 'Visitor deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete visitor:', error)
      toast({ title: 'Failed to delete visitor', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front Office' }, { label: 'Visitor Book' }]} />
      <PageHeader
        title="Visitor Book"
        description="Manage visitor records."
        icon={Users}
        actions={<Button onClick={() => setAddOpen(true)}><Users className="mr-2 h-4 w-4" /> Add Visitor</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Visitors" value={stats.total} icon={Users} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by visitor, purpose, or meeting with…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="visitor-book" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No visitors found" description="Add a visitor to get started." actionLabel="Add Visitor" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Visitor' : 'Add Visitor'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update visitor details' : 'Add a new visitor record'}</DialogDescription>
          </DialogHeader>
          <VisitorForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Visitor Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Visitor Name', value: viewRow.visitor_name || '—' },
              { label: 'Purpose', value: viewRow.purpose || '—' },
              { label: 'Meeting With', value: viewRow.meeting_with || '—' },
              { label: 'In Time', value: viewRow.in_time || '—' },
              { label: 'Out Time', value: viewRow.out_time || '—' },
              { label: 'Date', value: viewRow.date ? formatDate(viewRow.date) : '—' },
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
            <DialogTitle>Delete Visitor</DialogTitle>
            <DialogDescription>Are you sure you want to delete this visitor? This action cannot be undone.</DialogDescription>
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

function VisitorForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    visitor_name: '', purpose: '', meeting_with: '', in_time: '', out_time: '', date: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        visitor_name: initial.visitor_name || '', purpose: initial.purpose || '', meeting_with: initial.meeting_with || '', in_time: initial.in_time || '', out_time: initial.out_time || '', date: initial.date ? initial.date.split('T')[0] : '',
      })
    } else {
      setFormData({
        visitor_name: '', purpose: '', meeting_with: '', in_time: '', out_time: '', date: new Date().toISOString().split('T')[0],
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
        <Label htmlFor="visitor_name">Visitor Name *</Label>
        <Input id="visitor_name" value={formData.visitor_name} onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="purpose">Purpose *</Label>
        <Input id="purpose" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="meeting_with">Meeting With *</Label>
        <Input id="meeting_with" value={formData.meeting_with} onChange={(e) => setFormData({ ...formData, meeting_with: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="in_time">In Time</Label>
        <Input id="in_time" type="time" value={formData.in_time} onChange={(e) => setFormData({ ...formData, in_time: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="out_time">Out Time</Label>
        <Input id="out_time" type="time" value={formData.out_time} onChange={(e) => setFormData({ ...formData, out_time: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
