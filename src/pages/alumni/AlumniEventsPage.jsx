// ====================================================================
// Module: Alumni
// Page: Alumni Events
//
// Purpose:
// Manage alumni events — scheduling, venue, and descriptions for
// reunions, workshops, and fundraisers.
//
// Data Source:
// alumni.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
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
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { StatusBadge } from '@/components/StatusBadge'
import { useAlumniEvents } from '@/hooks/useAlumni'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'event_title', label: 'Event Title' },
  { key: 'date', label: 'Date' },
  { key: 'venue', label: 'Venue' },
  { key: 'description', label: 'Description' },
  { key: 'rsvp_deadline', label: 'RSVP Deadline' },
]

export default function AlumniEventsPage() {
  const {
    rows, stats, isLoading,
    search, setSearch,
    saveEvent, deleteEvent,
  } = useAlumniEvents()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveEvent(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteEvent(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'event_title',
      header: 'Event',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.event_title}</span>
            <span className="text-xs text-muted-foreground">{formatDate(row.original.date)}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'venue', header: 'Venue', cell: ({ row }) => <Badge variant="secondary">{row.original.venue}</Badge> },
    { accessorKey: 'description', header: 'Description' },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Alumni' }, { label: 'Events' }]} />
      <PageHeader
        title="Alumni Events"
        description="Schedule and manage alumni reunions, workshops, and gatherings."
        icon={CalendarDays}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Event</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Events" value={stats.total ?? 0} icon={CalendarDays} accent="primary" />
        <StatCard label="Upcoming" value={stats.upcoming ?? 0} icon={CalendarDays} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by event name or venue…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={rows} columns={EXPORT_COLS} filename="alumni-events" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No events found" description="Add a new alumni event to get started." actionLabel="Add Event" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="alumni-events"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Reusable Event Form Drawer used for both Add and Edit. */}
      <EventFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Event' : 'Add Event'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Event Details"
        description={viewRow?.event_title}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{viewRow.event_title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(viewRow.date)}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Date', value: formatDate(viewRow.date) },
                { label: 'Venue', value: viewRow.venue },
                { label: 'Description', value: viewRow.description },
                { label: 'RSVP Deadline', value: formatDate(viewRow.rsvp_deadline) },
                { label: 'Created On', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.event_title}
        onConfirm={handleDelete}
      />
    </div>
  )
}

// ─── Event Form Drawer (shared by Add and Edit) ──────────────────────────────
function EventFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    event_title: initial?.event_title || '',
    date: initial?.date || '',
    venue: initial?.venue || '',
    description: initial?.description || '',
    rsvp_deadline: initial?.rsvp_deadline || '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Event scheduling and details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Event'}
          submitDisabled={!form.event_title.trim() || !form.date}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Event Title <span className="text-destructive">*</span></Label>
            <Input value={form.event_title} onChange={(e) => set('event_title', e.target.value)} placeholder="e.g. Annual Alumni Meet 2024" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Venue</Label>
              <Input value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. School Auditorium" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Event description" rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">RSVP Deadline</Label>
            <Input type="date" value={form.rsvp_deadline} onChange={(e) => set('rsvp_deadline', e.target.value)} />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
