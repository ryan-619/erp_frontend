// ====================================================================
// Module: Settings
// Page: Role Permissions
//
// Purpose:
// Manage roles and their module-level permissions.
//
// Backend fields: role_name, role_type, permissions (Mixed)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { useRolePermissions } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function RolePermissionPage() {
  const { rows, isLoading, search, setSearch, saveRolePermission, deleteRolePermission } = useRolePermissions()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveRolePermission(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteRolePermission(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'role_name', header: 'Role' },
    { accessorKey: 'role_type', header: 'Type', cell: ({ row }) => <span className="text-muted-foreground">{row.original.role_type || '—'}</span> },
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Role Permissions' }]} />
      <PageHeader
        title="Role Permissions"
        description="Define roles and the modules each role can access."
        icon={ShieldCheck}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Role</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search roles…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={3} />
      ) : rows.length === 0 ? (
        <NoData title="No roles found" description="Add a new role to get started." actionLabel="Add Role" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <RoleFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Role' : 'Add Role'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Role Details"
        description={viewRow?.role_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Role', value: viewRow.role_name },
              { label: 'Type', value: viewRow.role_type || '—' },
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
        entityName={deleteRow?.role_name}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function RoleFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    role_name: '',
    role_type: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        role_name: initial.role_name || '',
        role_type: initial.role_type || '',
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        role_name: '',
        role_type: '',
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = () => {
    onSubmit(form)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Role information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Role'}
          submitDisabled={!form.role_name.trim()}
          onSubmit={handleSubmit}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Role Name <span className="text-destructive">*</span></Label>
            <Input value={form.role_name} onChange={(e) => set('role_name', e.target.value)} placeholder="e.g. Admin" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role Type</Label>
            <Input value={form.role_type} onChange={(e) => set('role_type', e.target.value)} placeholder="e.g. admin, staff" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
