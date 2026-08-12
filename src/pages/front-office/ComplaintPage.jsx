// ====================================================================
// Module: Front Office
// Page: Complaint
//
// Purpose:
// Manage complaints.
//
// Data Source:
// frontOffice.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { MessageSquare, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  { key: 'complainant_name', label: 'Complainant' },
  { key: 'complaint_type', label: 'Type' },
  { key: 'phone', label: 'Phone' },
  { key: 'complaint', label: 'Complaint' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
]

export default function ComplaintPage() {
  const { toast } = useToast()
  const { data: complaints, isLoading, refetch } = useAsyncData(() => frontOfficeService.getComplaints(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = complaints || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.complainant_name || '').toLowerCase().includes(q) ||
      (r.complaint_type || '').toLowerCase().includes(q) ||
      (r.complaint || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    open: rows.filter((r) => r.status === 'open').length,
    inProgress: rows.filter((r) => r.status === 'in-progress').length,
    resolved: rows.filter((r) => r.status === 'resolved').length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'complainant_name',
      header: 'Complainant',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.complainant_name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{row.original.complaint_type || 'No type'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone || '—' },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'resolved' ? 'default' : row.original.status === 'in-progress' ? 'secondary' : 'destructive'}>{row.original.status || 'Open'}</Badge> },
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
        await frontOfficeService.updateComplaint(id, payload)
        toast({ title: 'Complaint updated successfully' })
        setEditRow(null)
      } else {
        await frontOfficeService.createComplaint(payload)
        toast({ title: 'Complaint created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save complaint:', error)
      toast({ title: 'Failed to save complaint', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontOfficeService.deleteComplaint(id)
      toast({ title: 'Complaint deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete complaint:', error)
      toast({ title: 'Failed to delete complaint', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front Office' }, { label: 'Complaint' }]} />
      <PageHeader
        title="Complaints"
        description="Manage complaints."
        icon={MessageSquare}
        actions={<Button onClick={() => setAddOpen(true)}><MessageSquare className="mr-2 h-4 w-4" /> Add Complaint</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={MessageSquare} accent="primary" />
        <StatCard label="Open" value={stats.open} icon={MessageSquare} accent="destructive" />
        <StatCard label="In Progress" value={stats.inProgress} icon={MessageSquare} accent="secondary" />
        <StatCard label="Resolved" value={stats.resolved} icon={MessageSquare} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by complainant, type, or complaint…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="complaints" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No complaints found" description="Add a complaint to get started." actionLabel="Add Complaint" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Complaint' : 'Add Complaint'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update complaint details' : 'Add a new complaint'}</DialogDescription>
          </DialogHeader>
          <ComplaintForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Complaint Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Complainant', value: viewRow.complainant_name || '—' },
              { label: 'Type', value: viewRow.complaint_type || '—' },
              { label: 'Phone', value: viewRow.phone || '—' },
              { label: 'Complaint', value: viewRow.complaint || '—' },
              { label: 'Date', value: viewRow.date ? formatDate(viewRow.date) : '—' },
              { label: 'Status', value: viewRow.status || 'Open' },
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
            <DialogTitle>Delete Complaint</DialogTitle>
            <DialogDescription>Are you sure you want to delete this complaint? This action cannot be undone.</DialogDescription>
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

function ComplaintForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    complaint_type: '', complainant_name: '', phone: '', complaint: '', date: '', status: 'open',
  })

  useState(() => {
    if (initial) {
      setFormData({
        complaint_type: initial.complaint_type || '', complainant_name: initial.complainant_name || '', phone: initial.phone || '', complaint: initial.complaint || '', date: initial.date ? initial.date.split('T')[0] : '', status: initial.status || 'open',
      })
    } else {
      setFormData({
        complaint_type: '', complainant_name: '', phone: '', complaint: '', date: new Date().toISOString().split('T')[0], status: 'open',
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
        <Label htmlFor="complainant_name">Complainant Name *</Label>
        <Input id="complainant_name" value={formData.complainant_name} onChange={(e) => setFormData({ ...formData, complainant_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="complaint_type">Complaint Type *</Label>
        <Input id="complaint_type" value={formData.complaint_type} onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="complaint">Complaint *</Label>
        <Textarea id="complaint" value={formData.complaint} onChange={(e) => setFormData({ ...formData, complaint: e.target.value })} placeholder="Complaint details..." rows={3} required />
      </div>
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
