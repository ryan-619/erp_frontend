// ====================================================================
// Module: Academics
// Page: Classes
//
// Purpose:
// Manage academic classes and grade levels.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from "react"
import { Plus, BookOpen, Pencil, Trash2, Eye, Layers } from 'lucide-react'
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
import { useClasses } from '@/hooks/useAcademics'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  {
    key: "class_name",
    label: "Class Name",
  },
  {
    key: "createdAt",
    label: "Created",
  },
]

export default function ClassesPage() {
  const { toast } = useToast()
  const {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    saveClass,
    deleteClass,
  } = useClasses()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const columns = useMemo(
    () => [
      {
        accessorKey: "class_name",
        header: "Class Name",

        cell: ({ row }) => (
          <button
            onClick={() => setViewRow(row.original)}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="font-medium">
                {row.original.class_name?.startsWith("Class")
                  ? row.original.class_name
                  : `Class ${row.original.class_name}`}
              </p>

              <p className="text-xs text-muted-foreground">
                Academic Class
              </p>
            </div>
          </button>
        ),
      },

      {
        accessorKey: "createdAt",

        header: "Created",

        cell: ({ row }) =>
          formatDate(row.original.createdAt),
      },
    ],
    []
  )

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Classes' }]} />
      <PageHeader
        title="Classes"
        description="Manage academic classes and grade levels."
        icon={BookOpen}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Class</Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Classes"
          value={stats.total}
          icon={BookOpen}
          accent="primary"
        />
        <StatCard
          label="Showing"
          value={filtered.length}
          icon={Layers}
          accent="success"
        />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search classes…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="classes" />
          <FilterSelect value={status} onChange={setStatus} />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No classes found" actionLabel="Add Class" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableSelection
          enableExport
          exportFilename="classes"
          bulkActions={[{ label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => { toast({ title: 'Classes deleted' }) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <ClassDrawer open={addOpen} onOpenChange={setAddOpen} title="Add Class" onSubmit={async (p) => { await saveClass(p); setAddOpen(false) }} />
      <ClassDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Class" initial={editRow} onSubmit={async (p) => { await saveClass(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Class Details" description={viewRow?.class_name} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: "Class Name",
                value: viewRow.class_name,
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

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={deleteRow?.class_name}
        onConfirm={() => { deleteClass(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function FilterSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
      <option value="all">All statuses</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  )
}

function ClassDrawer({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}) {
  const [form, setForm] = useState({
    class_name: "",
  })

  useEffect(() => {
    setForm({
      class_name: initial?.class_name || "",
    })
  }, [initial])

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Enter class information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? "Update Class" : "Create Class"}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(form)
        }}
        className="space-y-5"
      >
        <FormSection columns={1}>
          <div className="space-y-2">
            <Label>
              Class Name
              <span className="text-destructive">
                *
              </span>
            </Label>

            <Input
              placeholder="Example : Class 10"
              value={form.class_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  class_name: e.target.value,
                })
              }
              required
            />
          </div>
        </FormSection>

        <button
          type="submit"
          className="hidden"
        />
      </form>
    </Drawer>
  )
}