// ====================================================================
// Module: Colleges
// Page: Colleges
//
// Purpose:
// Manage college records and their configuration.
//
// Data Source:
// college.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'

import { Plus, Building2, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useColleges } from '@/hooks/useColleges'
import { STATUS_OPTIONS } from '@/constants/navigation'
import { formatDate } from '@/utils/format'



export default function CollegesPage() {
  const {
    rows, stats, isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveCollege, deleteCollege,
  } = useColleges()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveCollege(payload, id);

    setEditRow(null);
    setAddOpen(false);
}  
  const columns = useMemo(
    () => [
      {
        accessorKey: 'college_name',
        header: 'College',
        cell: ({ row }) => (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium hover:underline">{row.original.college_name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </button>
        ),
      },
      { accessorKey: 'college_code', header: 'Code', cell: ({ row }) => <Badge variant="outline">{row.original.college_code}</Badge> },
      { accessorKey: 'type', header: 'Type' },
      { accessorKey: 'address', header: 'Address' },
      { accessorKey: 'phone', header: 'Phone' },
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Institutions' }, { label: 'Colleges' }]} />
      <PageHeader
        title="Colleges"
        description="Manage colleges within tenant databases."
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add College</Button>}
      />
      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search colleges…" className="max-w-sm" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]} />
      </FilterBar>
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={7} />
      ) : rows.length === 0 ? (
        <NoData title="No colleges found" description="Add a new college to get started." actionLabel="Add College" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      {/* Reusable College Form Drawer used for both Add and Edit. */}
      <CollegeFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit College' : 'Add College'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}      
      />

      

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="College Details"
        description={viewRow?.college_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-chart-4/10 text-chart-4">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{viewRow.college_name}</p>
                <p className="text-xs text-muted-foreground">{viewRow.email}</p>
              </div>
              <StatusBadge status={viewRow.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Code', value: viewRow.college_code },
                { label: 'Type', value: viewRow.type },
                { label: 'Phone', value: viewRow.phone },
                { label: 'Address', value: viewRow.address },
                { label: 'Status', value: viewRow.status },
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
        entityName={deleteRow?.college_name}
        onConfirm={async () => {
            await deleteCollege(deleteRow._id);
            setDeleteRow(null);
        }}
      />
    </div>
  )
}

// ─── College Form Drawer (shared by Add and Edit) ─────────────────────────────
function CollegeFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    college_name: initial?.college_name || '',
    college_code: initial?.college_code || '',
    type: initial?.type || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    address: initial?.address || '',
    status: initial?.status || 'active',
  })

 
  useEffect(() => {
    setForm({
      college_name: initial?.college_name || '',
      college_code: initial?.college_code || '',
      type: initial?.type || '',
      email: initial?.email || '',
      phone: initial?.phone || '',
      address: initial?.address || '',
      status: initial?.status || 'active',
    })
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="College contact and configuration information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={
            isSaving
                ? initial
                    ? "Updating..."
                    : "Creating..."
                : initial
                    ? "Save Changes"
                    : "Add College"
        }
        submitDisabled={
              isSaving ||
              !form.college_name.trim() ||
              !form.college_code.trim()
          }
        onSubmit={async () => {
            setIsSaving(true);

            try {
                await onSubmit(form);
            } finally {
                setIsSaving(false);
            }
        }}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">College Name <span className="text-destructive">*</span></Label>
            <Input value={form.college_name} onChange={(e) => set('college_name', e.target.value)} placeholder="e.g. St. Xavier's College" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Code <span className="text-destructive">*</span></Label>
              <Input value={form.college_code} onChange={(e) => set('college_code', e.target.value)} placeholder="e.g. SXC" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Input value={form.type} onChange={(e) => set('type', e.target.value)} placeholder="e.g. Autonomous" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1-555-0100" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="College address" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
