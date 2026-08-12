// ====================================================================
// Module: Fees
// Page: Fees Group
//
// Purpose:
// Organize fee types into logical groups.
//
// Data Source:
// fees.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { Layers, Plus, Pencil, Trash2, Eye } from 'lucide-react'
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
import { useFeesGroups } from '@/hooks/useFees'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'fees_group_name', label: 'Group Name' },
  { key: 'fees_group_type', label: 'Group Type' },
]

export default function FeesGroupPage() {
  const { toast } = useToast()
  const { rows, stats, isLoading, search, setSearch, saveGroup, deleteGroup } = useFeesGroups()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const columns = useMemo(() => [
    {
      accessorKey: 'fees_group_name',
      header: 'Group Name',
      cell: ({ row }) => (
        <button
          className="text-left font-medium hover:underline"
          onClick={() => setViewRow(row.original)}
        >
          {row.original.fees_group_name}
        </button>
      ),
    },
    {
      accessorKey: 'fees_group_type',
      header: 'Group Type',
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Fees', to: '/fees/collect' }, { label: 'Fees Group' }]} />
      <PageHeader
        title="Fees Group"
        description="Organize fee types into logical groups."
        icon={Layers}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Group</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Groups" value={stats.total} icon={Layers} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search group name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={rows} columns={EXPORT_COLS} filename="fees-groups" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={2} />
      ) : rows.length === 0 ? (
        <NoData title="No groups found" actionLabel="Add Group" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={rows} enableExport exportFilename="fees-groups" rowActions={(r) => <ActionDropdown actions={rowActions(r)} />} />
      )}

      <GroupDrawer open={addOpen} onOpenChange={setAddOpen} title="Add Group" onSubmit={async (p) => { await saveGroup(p); setAddOpen(false) }} />
      <GroupDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Group" initial={editRow} onSubmit={async (p) => { await saveGroup(p, editRow._id); setEditRow(null) }} />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Group Details"
        description={viewRow?.fees_group_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Group Name', value: viewRow.fees_group_name },
              { label: 'Group Type', value: viewRow.fees_group_type },
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
        entityName={deleteRow?.fees_group_name}
        onConfirm={() => { deleteGroup(deleteRow._id); setDeleteRow(null) }}
      />
    </div>
  )
}

function GroupDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    fees_group_name: initial?.fees_group_name || '',
    fees_group_type: initial?.fees_group_type || 'monthly',
  })

  useEffect(() => {
    setForm({
      fees_group_name: initial?.fees_group_name || '',
      fees_group_type: initial?.fees_group_type || 'monthly',
    })
  }, [initial, open])

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Fee group details"
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
            <Label className="text-xs">Group Name <span className="text-destructive">*</span></Label>
            <Input
              value={form.fees_group_name}
              onChange={(e) => setForm({ ...form, fees_group_name: e.target.value })}
              placeholder="e.g. Tuition Fees"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Group Type <span className="text-destructive">*</span></Label>
            <select
              value={form.fees_group_type}
              onChange={(e) => setForm({ ...form, fees_group_type: e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="transport">Transport</option>
              <option value="exam">Exam</option>
              <option value="other">Other</option>
            </select>
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}