// ====================================================================
// Module: Academics
// Page: Subjects
//
// Purpose:
// Manage subjects, marks distribution, and groups.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, Library, Pencil, Trash2, Eye, BookOpen } from 'lucide-react'
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
import { useSubjects } from '@/hooks/useAcademics'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "subject_name", label: "Subject" },
  { key: "subject_code", label: "Code" },
  { key: "createdAt", label: "Created" },
]

export default function SubjectsPage() {
  const { toast } = useToast()
  const {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    saveSubject,
    deleteSubject,
    bulkDelete,
  } = useSubjects()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const columns = useMemo(() => [
    {
      accessorKey: "subject_name",
      header: "Subject",
      cell: ({ row }) => (
        <button
          onClick={() => setViewRow(row.original)}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Library className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-medium">
              {row.original.subject_name}
            </p>

            <p className="text-xs text-muted-foreground">
              {row.original.subject_code}
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Subjects' }]} />
      <PageHeader
        title="Subjects"
        description="Manage subjects, marks distribution, and groups."
        icon={Library}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Subject</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Subjects"
          value={stats.total}
          icon={Library}
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
        <SearchBar value={search} onChange={setSearch} placeholder="Search subjects…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="subjects" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <NoData title="No subjects found" actionLabel="Add Subject" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableSelection
          enableExport
          exportFilename="subjects"
          bulkActions={[{ label: 'Delete', icon: Trash2, variant: 'destructive', onClick: (ids) => { bulkDelete(ids) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <SubjectDrawer open={addOpen} onOpenChange={setAddOpen} title="Add Subject" onSubmit={async (p) => { await saveSubject(p); setAddOpen(false) }} />
      <SubjectDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Subject" initial={editRow} onSubmit={async (p) => { await saveSubject(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Subject Details" description={viewRow?.subject_name} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: "Subject Name",
                value: viewRow.subject_name,
              },
              {
                label: "Subject Code",
                value: viewRow.subject_code,
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

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={deleteRow?.subject_name}
        onConfirm={() => { deleteSubject(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function SubjectDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    subject_name: initial?.subject_name || '',
    subject_code: initial?.subject_code || '',
  })

  useEffect(() => {
    setForm({
      subject_name: initial?.subject_name || '',
      subject_code: initial?.subject_code || '',
    })
  }, [initial])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description="Subject details" width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save' : 'Create'} onSubmit={() => onSubmit(form)} />}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject Name <span className="text-destructive">*</span></Label>
            <Input value={form.subject_name} onChange={(e) => setForm((f) => ({ ...f, subject_name: e.target.value }))} placeholder="e.g. Mathematics" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject Code <span className="text-destructive">*</span></Label>
            <Input value={form.subject_code} onChange={(e) => setForm((f) => ({ ...f, subject_code: e.target.value }))} placeholder="e.g. MATH" required />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}
