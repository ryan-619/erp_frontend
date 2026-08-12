// ====================================================================
// Module: Front CMS
// Page: Events
//
// Purpose:
// Manage events.
//
// Data Source:
// frontCms.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Calendar, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { frontCmsService } from '@/services/frontCms.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'event_title', label: 'Event Title' },
  { key: 'event_date', label: 'Event Date' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created At' },
]

export default function EventPage() {
  const { toast } = useToast()
  const { data: events, isLoading, refetch } = useAsyncData(() => frontCmsService.getEvents(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = events || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.event_title || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'event_title',
      header: 'Event',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.event_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.event_date ? formatDate(row.original.event_date) : 'No date'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.description || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, file, id) => {
    try {
      if (id) {
        await frontCmsService.updateEvent(id, payload)
        toast({ title: 'Event updated successfully' })
        setEditRow(null)
      } else {
        await frontCmsService.createEvent(payload, file)
        toast({ title: 'Event created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save event:', error)
      toast({ title: 'Failed to save event', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontCmsService.deleteEvent(id)
      toast({ title: 'Event deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete event:', error)
      toast({ title: 'Failed to delete event', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front CMS' }, { label: 'Events' }]} />
      <PageHeader
        title="Events"
        description="Manage events."
        icon={Calendar}
        actions={<Button onClick={() => setAddOpen(true)}><Calendar className="mr-2 h-4 w-4" /> Add Event</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Events" value={stats.total} icon={Calendar} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or description…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="events" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No events found" description="Add an event to get started." actionLabel="Add Event" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update event details' : 'Add a new event'}</DialogDescription>
          </DialogHeader>
          <EventForm initial={editRow} onSubmit={(payload, file) => handleSave(payload, file, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Event Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Event Title', value: viewRow.event_title || '—' },
              { label: 'Event Date', value: viewRow.event_date ? formatDate(viewRow.event_date) : '—' },
              { label: 'Description', value: viewRow.description || '—' },
              { label: 'Image', value: viewRow.image ? 'Uploaded' : '—' },
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
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>Are you sure you want to delete this event? This action cannot be undone.</DialogDescription>
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

function EventForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    event_title: '', event_date: '', description: '',
  })
  const [file, setFile] = useState(null)

  useState(() => {
    if (initial) {
      setFormData({
        event_title: initial.event_title || '', event_date: initial.event_date ? initial.event_date.split('T')[0] : '', description: initial.description || '',
      })
    } else {
      setFormData({
        event_title: '', event_date: new Date().toISOString().split('T')[0], description: '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData, file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="event_title">Event Title *</Label>
        <Input id="event_title" value={formData.event_title} onChange={(e) => setFormData({ ...formData, event_title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="event_date">Event Date *</Label>
        <Input id="event_date" type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Event description..." rows={3} />
      </div>
      <div>
        <Label htmlFor="image">Image</Label>
        <Input id="image" type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*" />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
