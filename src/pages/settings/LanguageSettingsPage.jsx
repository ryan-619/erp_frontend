// ====================================================================
// Module: Settings
// Page: Language Settings
//
// Purpose:
// Manage supported languages for the system interface.
//
// Backend fields: language_name, code, is_rtl (Boolean), status (active|inactive), is_active (Boolean)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { Languages, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { useLanguages } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function LanguageSettingsPage() {
  const {
    rows, isLoading, search, setSearch,
    saveLanguage, deleteLanguage, setActiveLanguage, toggleLanguageRtl, updateLanguageStatus,
  } = useLanguages()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveLanguage(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteLanguage(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'language_name', header: 'Language' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'is_rtl', header: 'RTL', cell: ({ row }) => row.original.is_rtl ? <Badge variant="secondary">RTL</Badge> : <span className="text-muted-foreground">LTR</span> },
    { accessorKey: 'is_active', header: 'Active', cell: ({ row }) => row.original.is_active ? <Badge className="bg-green-600">Default</Badge> : <span className="text-muted-foreground">—</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { label: 'Set Active', icon: Languages, onClick: () => setActiveLanguage(r._id) },
    { label: 'Toggle RTL', onClick: () => toggleLanguageRtl(r._id) },
    { label: r.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => updateLanguageStatus(r._id, r.status === 'active' ? 'inactive' : 'active') },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Languages' }]} />
      <PageHeader
        title="Language Settings"
        description="Manage supported languages for the system interface."
        icon={Languages}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Language</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search languages…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No languages found" description="Add a new language to get started." actionLabel="Add Language" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <LanguageFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Language' : 'Add Language'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Language Details"
        description={viewRow?.language_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Language', value: viewRow.language_name },
              { label: 'Code', value: viewRow.code },
              { label: 'RTL', value: viewRow.is_rtl ? 'Yes' : 'No' },
              { label: 'Active', value: viewRow.is_active ? 'Yes' : 'No' },
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
        entityName={deleteRow?.language_name}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function LanguageFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    language_name: '',
    code: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        language_name: initial.language_name || '',
        code: initial.code || '',
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        language_name: '',
        code: '',
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Language configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Language'}
          submitDisabled={!form.language_name.trim() || !form.code.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Language Name <span className="text-destructive">*</span></Label>
            <Input value={form.language_name} onChange={(e) => set('language_name', e.target.value)} placeholder="English" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Language Code <span className="text-destructive">*</span></Label>
            <Input value={form.code} onChange={(e) => set('code', e.target.value.toLowerCase())} placeholder="en" required />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
