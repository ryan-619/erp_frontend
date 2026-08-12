// ====================================================================
// Module: Fees
// Page: Fees Type
//
// Purpose:
// Define individual fee types.
//
// Data Source:
// fees.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { Tags, Plus, Pencil, Trash2, Eye } from 'lucide-react'
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
import { useAsyncData } from '@/hooks/useAsyncData'
import { feesService } from '@/services/fees.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "fees_type_name", label: "Fee Type" },
]

export default function FeesTypePage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => feesService.getFeesTypes(), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = data || []
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        !search ||
        r.fees_type_name?.toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  )

  const stats = useMemo(() => ({ total: rows.length }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: "fees_type_name",
      header: "Fee Type",
      cell: ({ row }) => (
        <button
          className="text-left font-medium hover:underline"
          onClick={() => setViewRow(row.original)}
        >
          {row.original.fees_type_name}
        </button>
      ),
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Fees', to: '/fees/collect' }, { label: 'Fees Type' }]} />
      <PageHeader
        title="Fees Type"
        description="Define individual fee types."
        icon={Tags}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Type</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Types" value={stats.total} icon={Tags} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search fee type…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="fees-types" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={2} />
      ) : filtered.length === 0 ? (
        <NoData title="No types found" actionLabel="Add Type" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} enableExport exportFilename="fees-types" rowActions={(r) => <ActionDropdown actions={rowActions(r)} />} />
      )}

      <TypeDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Type"
        onSubmit={async (p) => {
          await feesService.createFeesType(p)
          toast({ title: 'Type added', description: p.fees_type_name })
          setAddOpen(false)
          refetch()
        }}
      />

      <TypeDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Type"
        initial={editRow}
        onSubmit={async (p) => {
          await feesService.updateFeesType(editRow._id, p)
          toast({ title: 'Type updated' })
          setEditRow(null)
          refetch()
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Type Details"
        description={viewRow?.fees_type_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Type Name', value: viewRow.fees_type_name },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
            ].map((r) => (
              <div key={r.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.fees_type_name}
        onConfirm={async () => {
          await feesService.deleteFeesType(deleteRow._id)
          toast({ title: 'Type deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function TypeDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    fees_type_name: initial?.fees_type_name || "",
  })

  useEffect(() => {
    setForm({
      fees_type_name: initial?.fees_type_name || "",
    })
  }, [initial, open])

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Fee type details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save' : 'Create'}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Fee Type Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.fees_type_name}
              onChange={(e) => setForm({ fees_type_name: e.target.value })}
              placeholder="e.g. Tuition Fee"
              required
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}