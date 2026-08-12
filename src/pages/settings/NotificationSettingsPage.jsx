// ====================================================================
// Module: Settings
// Page: Notification Settings
//
// Purpose:
// Configure notification templates used by the system (e.g., email/SMS templates).
// These templates are used when sending notifications to users like students, parents, or staff.
//
// Backend fields: notification_type, template, enabled (Boolean)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { Bell, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { ActionDropdown } from '@/components/ActionDropdown'
import { useNotifications } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function NotificationSettingsPage() {
  const { rows, isLoading, search, setSearch, saveNotification, deleteNotification } = useNotifications()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveNotification(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteNotification(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'notification_type', header: 'Type' },
    { accessorKey: 'template', header: 'Template', cell: ({ row }) => <span className="text-xs text-muted-foreground line-clamp-1">{row.original.template}</span> },
    { accessorKey: 'enabled', header: 'Enabled', cell: ({ row }) => row.original.enabled ? <Badge>Enabled</Badge> : <span className="text-muted-foreground">Disabled</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Notifications' }]} />
      <PageHeader
        title="Notification Settings"
        description="Configure notification templates used for emails, SMS, and other alerts sent to students, parents, and staff."
        icon={Bell}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Notification</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search notifications…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No notifications found" description="Add a new notification to get started." actionLabel="Add Notification" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <NotificationFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Notification' : 'Add Notification'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Notification Details"
        description={viewRow?.notification_type}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Type', value: viewRow.notification_type },
              { label: 'Enabled', value: viewRow.enabled ? 'Yes' : 'No' },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value || '—'}</dd>
              </div>
            ))}
            <div className="col-span-2 space-y-0.5">
              <dt className="text-xs font-medium text-muted-foreground">Template</dt>
              <dd className="text-sm font-medium whitespace-pre-wrap">{viewRow.template || '—'}</dd>
            </div>
          </dl>
        )}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.notification_type}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function NotificationFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    notification_type: '',
    template: '',
    enabled: true,
  })

  useEffect(() => {
    if (initial) {
      setForm({
        notification_type: initial.notification_type || '',
        template: initial.template || '',
        enabled: initial.enabled ?? true,
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        notification_type: '',
        template: '',
        enabled: true,
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Notification template configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Notification'}
          submitDisabled={!form.notification_type.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Notification Type <span className="text-destructive">*</span></Label>
            <Input value={form.notification_type} onChange={(e) => set('notification_type', e.target.value)} placeholder="e.g. admission_alert" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Template</Label>
            <Textarea value={form.template} onChange={(e) => set('template', e.target.value)} placeholder="Dear {parent_name}…" rows={4} />
          </div>
        </FormSection>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Enabled</p>
            <p className="text-xs text-muted-foreground">Send this notification when triggered</p>
          </div>
          <Switch checked={!!form.enabled} onCheckedChange={(v) => set('enabled', v)} />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
