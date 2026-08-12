// ====================================================================
// Module: Settings
// Page: Session Settings
//
// Purpose:
// Manage academic sessions (years) and activate the current session.
//
// Backend fields: session_name, start_date, end_date, status (Active|Inactive)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'

import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { StatusBadge } from '@/components/StatusBadge'
import { ActionDropdown } from '@/components/ActionDropdown'
import { useSessions } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function SessionSettingsPage() {
  const {
    rows, isLoading,
    search, setSearch, statusFilter, setStatusFilter,
    saveSession, deleteSession, activateSession,
  } = useSessions()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveSession(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteSession(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'session_name', header: 'Session' },
    { accessorKey: 'start_date', header: 'Start Date', cell: ({ row }) => formatDate(row.original.start_date) },
    { accessorKey: 'end_date', header: 'End Date', cell: ({ row }) => formatDate(row.original.end_date) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { label: 'Activate', icon: CalendarClock, onClick: () => activateSession(r._id) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Sessions' }]} />
      <PageHeader
        title="Session Settings"
        description="Manage academic sessions and the current active session."
        icon={CalendarClock}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Session</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search sessions…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No sessions found" description="Add a new academic session to get started." actionLabel="Add Session" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <SessionFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Session' : 'Add Session'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Session Details"
        description={viewRow?.session_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Session', value: viewRow.session_name },
              { label: 'Start Date', value: formatDate(viewRow.start_date) },
              { label: 'End Date', value: formatDate(viewRow.end_date) },
              { label: 'Status', value: <StatusBadge status={viewRow.status} /> },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.session_name}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function SessionFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    session_name: '',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        session_name: initial.session_name || '',
        start_date: initial.start_date || '',
        end_date: initial.end_date || '',
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        session_name: '',
        start_date: '',
        end_date: '',
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Academic session configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Session'}
          submitDisabled={!form.session_name.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Session Name <span className="text-destructive">*</span></Label>
            <Input value={form.session_name} onChange={(e) => set('session_name', e.target.value)} placeholder="e.g. 2024-2025" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
