// ====================================================================
// Module: Academics
// Page: Subject Groups
//
// Purpose:
// Organize subjects into logical groups.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, FolderTree, Pencil, Trash2, Eye, Library, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { ImportButton } from '@/components/ImportButton'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useSubjectGroups } from '@/hooks/useAcademics'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "group_name", label: "Group" },
  { key: "group_code", label: "Code" },
  { key: "createdAt", label: "Created" },
]

export default function SubjectGroupsPage() {
  const { toast } = useToast()
  const { rows, allSubjectGroups, stats, isLoading, saveSubjectGroup, deleteSubjectGroup } = useSubjectGroups()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rowsAll = allSubjectGroups || []
  const filtered = useMemo(
    () => rowsAll.filter((r) => {
      const ms = !search || (r.group_name || '').toLowerCase().includes(search.toLowerCase()) || (r.group_code || '').toLowerCase().includes(search.toLowerCase())
      return ms
    }),
    [rowsAll, search],
  )

  const columns = useMemo(() => [
    {
      accessorKey: "group_name",
      header: "Group",
      cell: ({ row }) => (
        <button
          onClick={() => setViewRow(row.original)}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderTree className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-medium">
              {row.original.group_name}
            </p>

            <p className="text-xs text-muted-foreground">
              {row.original.group_code}
            </p>
          </div>
        </button>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Subject Groups' }]} />
      <PageHeader
        title="Subject Groups"
        description="Organize subjects into logical groups."
        icon={FolderTree}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Group</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Groups"
          value={stats.total}
          icon={FolderTree}
          accent="primary"
        />

        <StatCard
          label="Showing"
          value={filtered.length}
          icon={BookOpen}
          accent="success"
        />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search subject groups…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="subject-groups" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No subject groups found" actionLabel="Add Group" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableSelection
          enableExport
          exportFilename="subject-groups"
          bulkActions={[{ label: 'Delete', icon: Trash2, variant: 'destructive', onClick: (ids) => { ids.forEach((id) => deleteSubjectGroup(id)) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <GroupDrawer open={addOpen} onOpenChange={setAddOpen} title="Add Subject Group" onSubmit={async (p) => { await saveSubjectGroup(p); setAddOpen(false) }} />
      <GroupDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Subject Group" initial={editRow} onSubmit={async (p) => { await saveSubjectGroup(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Group Details" description={viewRow?.group_name} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: "Group Name",
                value: viewRow.group_name,
              },
              {
                label: "Group Code",
                value: viewRow.group_code,
              },
              {
                label: "Created",
                value: formatDate(viewRow.createdAt),
              },
              {
                label: "Updated",
                value: formatDate(viewRow.updatedAt),
              },
            ].map((r) => (
              <div key={r.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={deleteRow?.group_name}
        onConfirm={() => { deleteSubjectGroup(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function GroupDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    group_name: initial?.group_name || '',
    group_code: initial?.group_code || '',
  })

  useEffect(() => {
    setForm({
      group_name: initial?.group_name || '',
      group_code: initial?.group_code || '',
    })
  }, [initial])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description="Group details" width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save' : 'Create'} onSubmit={() => onSubmit(form)} />}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Group Name <span className="text-destructive">*</span></Label>
            <Input value={form.group_name} onChange={(e) => setForm((f) => ({ ...f, group_name: e.target.value }))} placeholder="e.g. Science Group" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Group Code <span className="text-destructive">*</span></Label>
            <Input value={form.group_code} onChange={(e) => setForm((f) => ({ ...f, group_code: e.target.value }))} placeholder="e.g. SCI" required />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}
