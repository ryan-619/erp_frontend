// ====================================================================
// Module: Settings
// Page: Custom Fields
//
// Purpose:
// Manage custom fields for students, staff, library, and transport.
//
// Backend fields: field_name, field_type, module, options ([String]), required (Boolean)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { Boxes, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { useCustomFields } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'

const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select']
const MODULES = ['Student', 'Staff', 'Library', 'Transport']

export default function CustomFieldPage() {
  const {
    rows, isLoading,
    search, setSearch, moduleFilter, setModuleFilter,
    saveCustomField, deleteCustomField,
  } = useCustomFields()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveCustomField(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteCustomField(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'field_name', header: 'Field Name' },
    { accessorKey: 'field_type', header: 'Type', cell: ({ row }) => <Badge variant="secondary">{row.original.field_type}</Badge> },
    { accessorKey: 'module', header: 'Module', cell: ({ row }) => <Badge variant="outline">{row.original.module}</Badge> },
    { accessorKey: 'required', header: 'Required', cell: ({ row }) => row.original.required ? <Badge>Required</Badge> : <span className="text-muted-foreground">Optional</span> },
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Custom Fields' }]} />
      <PageHeader
        title="Custom Fields"
        description="Manage custom fields for students, staff, library, and transport."
        icon={Boxes}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Field</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search fields…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All modules</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No custom fields found" description="Add a new custom field to get started." actionLabel="Add Field" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <CustomFieldFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Custom Field' : 'Add Custom Field'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Custom Field Details"
        description={viewRow?.field_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Field Name', value: viewRow.field_name },
                { label: 'Type', value: <Badge variant="secondary">{viewRow.field_type}</Badge> },
                { label: 'Module', value: <Badge variant="outline">{viewRow.module}</Badge> },
                { label: 'Required', value: viewRow.required ? 'Yes' : 'No' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value || '—'}</dd>
                </div>
              ))}
            </dl>
            {viewRow.options?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Options</p>
                <div className="flex flex-wrap gap-2">
                  {viewRow.options.map((o) => <span key={o} className="rounded-full border bg-muted/30 px-2.5 py-0.5 text-xs">{o}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.field_name}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function CustomFieldFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    field_name: '',
    field_type: 'text',
    module: 'Student',
    options: '',
    required: false,
  })

  useEffect(() => {
    if (initial) {
      setForm({
        field_name: initial.field_name || '',
        field_type: initial.field_type || 'text',
        module: initial.module || 'Student',
        options: Array.isArray(initial.options) ? initial.options.join(', ') : (initial.options || ''),
        required: initial.required || false,
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        field_name: '',
        field_type: 'text',
        module: 'Student',
        options: '',
        required: false,
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = () => {
    const options = typeof form.options === 'string'
      ? form.options.split(',').map((o) => o.trim()).filter(Boolean)
      : form.options
    onSubmit({ ...form, options })
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Custom field configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Field'}
          submitDisabled={!form.field_name.trim()}
          onSubmit={handleSubmit}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Field Name <span className="text-destructive">*</span></Label>
            <Input value={form.field_name} onChange={(e) => set('field_name', e.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="blood_group" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Field Type</Label>
            <select value={form.field_type} onChange={(e) => set('field_type', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Module</Label>
            <select value={form.module} onChange={(e) => set('module', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </FormSection>

        {form.field_type === 'select' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Options (comma-separated)</Label>
            <Input value={form.options} onChange={(e) => set('options', e.target.value)} placeholder="A+, B+, O+" />
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Required Field</p>
            <p className="text-xs text-muted-foreground">Must be filled when creating a record</p>
          </div>
          <Switch checked={!!form.required} onCheckedChange={(v) => set('required', v)} />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
