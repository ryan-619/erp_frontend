// ====================================================================
// Module: Settings
// Page: Captcha Settings
//
// Purpose:
// Manage captcha provider configurations (CRUD table, NOT singleton).
//
// Backend fields: provider, site_key, secret_key, status (active|inactive)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { Shield, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { useCaptchaSettings } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function CaptchaSettingsPage() {
  const { rows, isLoading, search, setSearch, saveCaptcha, deleteCaptcha, updateCaptchaStatus } = useCaptchaSettings()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveCaptcha(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteCaptcha(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'provider', header: 'Provider' },
    { accessorKey: 'site_key', header: 'Site Key', cell: ({ row }) => <span className="text-xs text-muted-foreground font-mono">{row.original.site_key}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { label: r.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => updateCaptchaStatus(r._id, r.status === 'active' ? 'inactive' : 'active') },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Captcha' }]} />
      <PageHeader
        title="Captcha Settings"
        description="Manage captcha provider configurations for public forms."
        icon={Shield}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Captcha</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search captcha configs…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No captcha configurations found" description="Add a new captcha provider to get started." actionLabel="Add Captcha" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <CaptchaFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Captcha' : 'Add Captcha'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Captcha Details"
        description={viewRow?.provider}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Provider', value: viewRow.provider },
              { label: 'Site Key', value: <span className="font-mono text-xs">{viewRow.site_key}</span> },
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

function CaptchaFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    provider: '',
    site_key: '',
    secret_key: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        provider: initial.provider || '',
        site_key: initial.site_key || '',
        secret_key: initial.secret_key || '',
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        provider: '',
        site_key: '',
        secret_key: '',
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Captcha provider configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Captcha'}
          submitDisabled={!form.provider.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Provider <span className="text-destructive">*</span></Label>
            <Input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Google reCAPTCHA" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Site Key</Label>
            <Input value={form.site_key} onChange={(e) => set('site_key', e.target.value)} placeholder="Public site key" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Secret Key</Label>
            <Input type="password" value={form.secret_key} onChange={(e) => set('secret_key', e.target.value)} placeholder="Private secret key" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
