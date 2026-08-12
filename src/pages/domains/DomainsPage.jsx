// ====================================================================
// Module: Domains
// Page: Domains
//
// Purpose:
// Manage tenant domains and their verification status.
//
// Data Source:
// domain.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Plus, Globe, Eye, Pencil, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import FilterSelect from '@/components/common/FilterSelect'
import { FilterBar } from '@/components/FilterBar'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { StatusBadge } from '@/components/StatusBadge'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ActionDropdown } from '@/components/ActionDropdown'
import { FormSection } from '@/components/FormSection'
import { useDomains } from '@/hooks/useDomains'
import { STATUS_OPTIONS } from '@/constants/navigation'
import { formatDate } from '@/utils/format'

export default function DomainsPage() {
  const {
    rows, stats, isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveDomain, deleteDomain,
  } = useDomains()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveDomain(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'domain',
        header: 'Domain',
        cell: ({ row }) => (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <p className="font-medium hover:underline">{row.original.domain}</p>
          </button>
        ),
      },
      { accessorKey: 'school_name', header: 'Institution' },
      {
        accessorKey: 'verified',
        header: 'Verified',
        cell: ({ row }) =>
          row.original.verified ? (
            <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="h-4 w-4" /> Verified</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-warning"><ShieldAlert className="h-4 w-4" /> Pending</span>
          ),
      },
      { accessorKey: 'ssl', header: 'SSL' },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <ActionDropdown
            actions={[
              { label: 'View', icon: Eye, onClick: () => setViewRow(row.original) },
              { label: 'Edit', icon: Pencil, onClick: () => setEditRow(row.original) },
              { separator: true },
              { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(row.original) },
            ]}
          />
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Institutions' }, { label: 'Domains' }]} />
      <PageHeader
        title="Domains"
        description="Custom domains used for tenant resolution. The backend resolves tenants by request host."
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Register Domain</Button>}
      />
      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search domains…" className="max-w-sm" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]} />
      </FilterBar>
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <NoData title="No domains found" description="Register a new domain to get started." actionLabel="Register Domain" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      {/* Reusable Domain Form Drawer used for both Add and Edit. */}
      <DomainFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Domain' : 'Register Domain'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Domain Details"
        description={viewRow?.domain}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{viewRow.domain}</p>
                <p className="text-xs text-muted-foreground">{viewRow.school_name}</p>
              </div>
              {viewRow.verified ? (
                <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="h-4 w-4" /> Verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-warning"><ShieldAlert className="h-4 w-4" /> Pending</span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Institution', value: viewRow.school_name },
                { label: 'SSL', value: viewRow.ssl },
                { label: 'Verified', value: viewRow.verified ? 'Yes' : 'No' },
                { label: 'Status', value: viewRow.status },
                { label: 'Created On', value: formatDate(viewRow.createdAt) },
                { label: 'Updated On', value: formatDate(viewRow.updatedAt) },
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
        entityName={deleteRow?.domain}
        onConfirm={() => deleteDomain(deleteRow._id)}
      />
    </div>
  )
}

// ─── Domain Form Drawer (shared by Add and Edit) ─────────────────────────────
function DomainFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    domain: initial?.domain || '',
    school_name: initial?.school_name || '',
    ssl: initial?.ssl || '',
    verified: initial?.verified || false,
    status: initial?.status || 'active',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Tenant domain and verification information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Register Domain'}
          submitDisabled={!form.domain.trim() || !form.school_name.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Domain <span className="text-destructive">*</span></Label>
            <Input value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="e.g. greenwood.edu" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Institution <span className="text-destructive">*</span></Label>
            <Input value={form.school_name} onChange={(e) => set('school_name', e.target.value)} placeholder="e.g. Greenwood High" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SSL</Label>
            <Input value={form.ssl} onChange={(e) => set('ssl', e.target.value)} placeholder="e.g. active" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Verified</Label>
              <select value={String(form.verified)} onChange={(e) => set('verified', e.target.value === 'true')}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="false">Pending</option>
                <option value="true">Verified</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
