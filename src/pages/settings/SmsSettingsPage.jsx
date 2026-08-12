// ====================================================================
// Module: Settings
// Page: SMS Settings
//
// Purpose:
// Manage SMS gateway configurations (CRUD table, NOT singleton).
//
// Backend fields: provider, api_key, sender_id, status (Active|Inactive)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useSmsSettings } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function SmsSettingsPage() {
  const { rows, isLoading, search, setSearch, saveSms, deleteSms, activateSms } = useSmsSettings()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveSms(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteSms(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'provider', header: 'Provider' },
    { accessorKey: 'sender_id', header: 'Sender ID' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { label: 'Activate', icon: MessageSquare, onClick: () => activateSms(r._id) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'SMS' }]} />
      <PageHeader
        title="SMS Settings"
        description="Manage SMS gateway configurations and activate the active provider."
        icon={MessageSquare}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Gateway</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search gateways…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No SMS gateways found" description="Add a new SMS gateway to get started." actionLabel="Add Gateway" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <SmsFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Gateway' : 'Add Gateway'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Gateway Details"
        description={viewRow?.provider}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Provider', value: viewRow.provider },
              { label: 'Sender ID', value: viewRow.sender_id },
              { label: 'Status', value: <StatusBadge status={viewRow.status} /> },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
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
        entityName={deleteRow?.provider}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function SmsFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    provider: '',
    api_key: '',
    sender_id: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        provider: initial.provider || '',
        api_key: initial.api_key || '',
        sender_id: initial.sender_id || '',
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        provider: '',
        api_key: '',
        sender_id: '',
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="SMS gateway configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Gateway'}
          submitDisabled={!form.provider.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Provider <span className="text-destructive">*</span></Label>
            <Input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Twilio" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">API Key</Label>
            <Input type="password" value={form.api_key} onChange={(e) => set('api_key', e.target.value)} placeholder="Gateway API key" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sender ID</Label>
            <Input value={form.sender_id} onChange={(e) => set('sender_id', e.target.value)} placeholder="SCHLR" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
