// ====================================================================
// Module: Academics
// Page: Sections
//
// Purpose:
// Manage class sections, rooms, and capacities.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, Layers, Pencil, Trash2, Eye, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'

import { academicsService } from '@/services/academics.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { ImportButton } from '@/components/ImportButton'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useSections } from '@/hooks/useAcademics'

const EXPORT_COLS = [
  { key: "section_name", label: "Section" },
  { key: "class_name", label: "Class" },
  { key: "createdAt", label: "Created" },
]



export default function SectionsPage() {
  const { toast } = useToast()
  const { rows, allSections, stats, isLoading, search, setSearch, saveSection, deleteSection } = useSections()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [classOptions, setClassOptions] = useState([])

  useEffect(() => {
    academicsService.classes().then((res) => {
      setClassOptions(res || [])
    })
  }, [])

  // Build lookup map for efficient ID resolution
  const classMap = useMemo(() => {
    const map = {}
    classOptions.forEach(c => map[c._id] = c)
    return map
  }, [classOptions])

  const filtered = useMemo(
    () => rows.filter((r) => {
      const ms = !search || r.section_name?.toLowerCase().includes(search.toLowerCase()) || r.class_name?.toLowerCase().includes(search.toLowerCase())
      return ms
    }),
    [rows, search],
  )

  const columns = useMemo(() => [
    {
      accessorKey: "section_name",
      header: "Section",
      cell: ({ row }) => (
        <button
          onClick={() => setViewRow(row.original)}
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-5 w-5 text-primary" />
          </div>

          <div>
            <p className="font-medium">
              {row.original.section_name}
            </p>

            <p className="text-xs text-muted-foreground">
              {row.original.class_name || classMap[row.original.class_id]?.class_name || row.original.class_id}
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
  ], [classMap, search])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Sections' }]} />
      <PageHeader
        title="Sections"
        description="Manage class sections, rooms, and capacities."
        icon={Layers}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Section</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Sections"
          value={stats.total}
          icon={Layers}
          accent="primary"
        />

        <StatCard
          label="Showing"
          value={rows.length}
          icon={BookOpen}
          accent="success"
        />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search sections…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={rows.map(r => ({
              ...r,
              class_name: r.class_name || classMap[r.class_id]?.class_name || r.class_id,
            }))} 
            columns={EXPORT_COLS} 
            filename="sections" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No sections found" actionLabel="Add Section" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableSelection
          enableExport
          exportFilename="sections"
          bulkActions={[{ label: 'Delete', icon: Trash2, variant: 'destructive', onClick: (ids) => { ids.forEach((id) => deleteSection(id)) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <SectionDrawer open={addOpen} onOpenChange={setAddOpen} title="Add Section" classOptions={classOptions} onSubmit={async (p) => { await saveSection(p); setAddOpen(false) }} />
      <SectionDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Section" initial={editRow} classOptions={classOptions} onSubmit={async (p) => { await saveSection(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Section Details" description={viewRow ? `${viewRow.section_name} · ${classMap[viewRow.class_id]?.class_name || viewRow.class_id}` : ''} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: "Section",
                value: viewRow.section_name,
              },
              {
                label: "Class",
                value: classMap[viewRow.class_id]?.class_name || viewRow.class_id,
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

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={deleteRow ? `Section ${deleteRow.section_name}` : ''}
        onConfirm={() => { deleteSection(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function SectionDrawer({ open, onOpenChange, title, initial, classOptions = [], onSubmit }) {
  const [form, setForm] = useState({
    class_id: initial?.class_id || '',
    section_name: initial?.section_name || '',
  })

  useEffect(() => {
    setForm({
      class_id: initial?.class_id || '',
      section_name: initial?.section_name || '',
    })
  }, [initial])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description="Section details" width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save' : 'Create'} onSubmit={() => onSubmit(form)} />}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Class <span className="text-destructive">*</span></Label>
            <select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select class</option>
              {classOptions.map((c) => <option key={c._id || c.value} value={c._id || c.value}>{c.class_name || c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Section Name <span className="text-destructive">*</span></Label>
            <Input value={form.section_name} onChange={(e) => setForm((f) => ({ ...f, section_name: e.target.value }))} placeholder="e.g. A" required />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}
