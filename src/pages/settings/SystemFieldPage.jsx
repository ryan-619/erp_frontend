// ====================================================================
// Module: Settings
// Page: System Fields
//
// Purpose:
// Configure built-in system fields and toggle their status.
//
// Backend fields: field_name, field_type, module, status (active|inactive)
// ====================================================================

import { useMemo, useState } from 'react'
import { Settings, Plus, Eye, Trash2 } from 'lucide-react'
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
import { useSystemFields } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'

const FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'select']
const MODULES = ['Student', 'Staff', 'Library', 'Transport']

export default function SystemFieldPage() {
  const { rows, isLoading, search, setSearch, updateSystemFieldStatus, deleteSystemField } = useSystemFields()

  const [addOpen, setAddOpen] = useState(false)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleDelete = async () => {
    await deleteSystemField(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'field_name', header: 'Field Name' },
    { accessorKey: 'field_type', header: 'Type', cell: ({ row }) => <Badge variant="secondary">{row.original.field_type}</Badge> },
    { accessorKey: 'module', header: 'Module', cell: ({ row }) => <Badge variant="outline">{row.original.module}</Badge> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: r.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => updateSystemFieldStatus(r._id, r.status === 'active' ? 'inactive' : 'active') },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'System Fields' }]} />
      <PageHeader
        title="System Fields"
        description="Configure built-in system fields and toggle their status."
        icon={Settings}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search system fields…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No system fields found" description="System fields will appear here." />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="System Field Details"
        description={viewRow?.field_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Field Name', value: viewRow.field_name },
              { label: 'Type', value: <Badge variant="secondary">{viewRow.field_type}</Badge> },
              { label: 'Module', value: <Badge variant="outline">{viewRow.module}</Badge> },
              { label: 'Status', value: <StatusBadge status={viewRow.status} /> },
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
        entityName={deleteRow?.field_name}
        onConfirm={handleDelete}
      />
    </div>
  )
}
