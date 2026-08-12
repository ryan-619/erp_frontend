// ====================================================================
// Module: Schools
// Page: Schools
//
// Purpose:
// Manage school records and their configuration.
//
// Data Source:
// school.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, School, Eye, Pencil, Trash2, Loader2 } from 'lucide-react'
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
import { useSchools } from '@/hooks/useSchools'
import { STATUS_OPTIONS } from '@/constants/navigation'
import { formatDate } from '@/utils/format'

export default function SchoolsPage() {
  const {
    rows, stats, isLoading,
    search, setSearch,
    statusFilter, setStatusFilter,
    saveSchool, deleteSchool,
  } = useSchools()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
  await saveSchool(payload, id)

  // Close drawers after successful save
  setEditRow(null)
  setAddOpen(false)
}



  const columns = useMemo(
    () => [
      {
        accessorKey: 'school_name',
        header: 'School',
        cell: ({ row }) => (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <School className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium hover:underline">{row.original.school_name}</p>
              <p className="text-xs text-muted-foreground">{row.original.domain}</p>
            </div>
          </button>
        ),
      },
      { accessorKey: 'domain', header: 'Domain' },
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Institutions' }, { label: 'Schools' }]} />
      <PageHeader
        title="Schools"
        description="Manage all schools onboarded to the platform. Each school maps to a tenant database."
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add School</Button>}
      />
      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search schools…" className="max-w-sm" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]} />
      </FilterBar>
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No schools found" description="Add a new school to get started." actionLabel="Add School" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      {/* Reusable School Form Drawer used for both Add and Edit. */}
      <SchoolFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit School' : 'Add School'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="School Details"
        description={viewRow?.school_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <School className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{viewRow.school_name}</p>
                <p className="text-xs text-muted-foreground">{viewRow.domain}</p>
              </div>
              <StatusBadge status={viewRow.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Domain', value: viewRow.domain },
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
  entityName={deleteRow?.school_name}
  onConfirm={async () => {
    await deleteSchool(deleteRow._id)
    setDeleteRow(null)
  }}
/>

    </div>
  )
}

// ─── School Form Drawer (shared by Add and Edit) ─────────────────────────────
function SchoolFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    school_name: '',
    domain: '',
    status: 'active',
  })

  const [isSaving, setIsSaving] = useState(false)

  // Automatically populate form when editing
  useEffect(() => {
    setForm({
      school_name: initial?.school_name || '',
      domain: initial?.domain || '',
      status: initial?.status || 'active',
    })
  }, [initial, open])

  const set = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setIsSaving(true)

      await onSubmit(form)

      // Reset after Add
      if (!initial) {
        setForm({
          school_name: '',
          domain: '',
          status: 'active',
        })
      }

      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="School and tenant domain information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={
            isSaving
              ? initial
                ? 'Updating...'
                : 'Creating...'
              : initial
                ? 'Save Changes'
                : 'Add School'
          }
          submitDisabled={
            isSaving ||
            !form.school_name.trim() ||
            !form.domain.trim()
          }
          onSubmit={handleSubmit}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">
              School Name <span className="text-destructive">*</span>
            </Label>

            <Input
              value={form.school_name}
              disabled={isSaving}
              onChange={(e) => set('school_name', e.target.value)}
              placeholder="e.g. Greenwood High"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Domain <span className="text-destructive">*</span>
            </Label>

            <Input
              value={form.domain}
              disabled={isSaving}
              onChange={(e) => set('domain', e.target.value)}
              placeholder="e.g. greenwood.edu"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Status
            </Label>

            <select
              value={form.status}
              disabled={isSaving}
              onChange={(e) => set('status', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>
        </FormSection>

        <button
          type="submit"
          className="hidden"
          disabled={isSaving}
        />

        {isSaving && (
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {initial
              ? 'Updating school...'
              : 'Creating school...'}
          </div>
        )}
      </form>
    </Drawer>
  )
}