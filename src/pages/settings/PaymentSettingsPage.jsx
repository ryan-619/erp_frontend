// ====================================================================
// Module: Settings
// Page: Payment Settings
//
// Purpose:
// Manage payment gateway configurations (CRUD table, NOT singleton).
//
// Backend fields: provider, api_key, secret_key, mode (sandbox|live), status (Active|Inactive)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { CreditCard, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { usePaymentSettings } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function PaymentSettingsPage() {
  const { rows, isLoading, search, setSearch, savePayment, deletePayment, activatePayment } = usePaymentSettings()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await savePayment(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deletePayment(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'provider', header: 'Provider' },
    { accessorKey: 'mode', header: 'Mode', cell: ({ row }) => <Badge variant={row.original.mode === 'live' ? 'destructive' : 'secondary'}>{row.original.mode}</Badge> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { label: 'Activate', icon: CreditCard, onClick: () => activatePayment(r._id) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Payment' }]} />
      <PageHeader
        title="Payment Settings"
        description="Manage payment gateway configurations and activate the active provider."
        icon={CreditCard}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Gateway</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search gateways…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No payment gateways found" description="Add a new payment gateway to get started." actionLabel="Add Gateway" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <PaymentFormDrawer
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
              { label: 'Mode', value: <Badge variant={viewRow.mode === 'live' ? 'destructive' : 'secondary'}>{viewRow.mode}</Badge> },
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

function PaymentFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    provider: '',
    api_key: '',
    secret_key: '',
    mode: 'sandbox',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        provider: initial.provider || '',
        api_key: initial.api_key || '',
        secret_key: initial.secret_key || '',
        mode: initial.mode || 'sandbox',
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        provider: '',
        api_key: '',
        secret_key: '',
        mode: 'sandbox',
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Payment gateway configuration"
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
            <Input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Stripe" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">API Key</Label>
            <Input value={form.api_key} onChange={(e) => set('api_key', e.target.value)} placeholder="pk_test_…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Secret Key</Label>
            <Input type="password" value={form.secret_key} onChange={(e) => set('secret_key', e.target.value)} placeholder="sk_test_…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mode</Label>
            <select value={form.mode} onChange={(e) => set('mode', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="sandbox">sandbox</option>
              <option value="live">live</option>
            </select>
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
