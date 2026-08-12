// ====================================================================
// Module: Settings
// Page: Currency Settings
//
// Purpose:
// Manage supported currencies and exchange rates.
//
// Backend fields: currency_name, symbol, code, exchange_rate (Number),
//                 is_base (Boolean), status (active|inactive)
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { DollarSign, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { useCurrencies } from '@/hooks/useSettings'
import { formatDate } from '@/utils/format'



export default function CurrencySettingsPage() {
  const {
    rows, isLoading, search, setSearch,
    saveCurrency, deleteCurrency, setBaseCurrency, updateCurrencyStatus,
  } = useCurrencies()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveCurrency(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteCurrency(deleteRow._id)
    setDeleteRow(null)
  }

  const columns = useMemo(() => [
    { accessorKey: 'currency_name', header: 'Name' },
    { accessorKey: 'symbol', header: 'Symbol' },
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'exchange_rate', header: 'Exchange Rate' },
    { accessorKey: 'is_base', header: 'Base', cell: ({ row }) => row.original.is_base ? <Badge>Base</Badge> : <span className="text-muted-foreground">—</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { label: 'Set Base', icon: DollarSign, onClick: () => setBaseCurrency(r._id) },
    { label: r.status === 'active' ? 'Deactivate' : 'Activate', onClick: () => updateCurrencyStatus(r._id, r.status === 'active' ? 'inactive' : 'active') },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }, { label: 'Currencies' }]} />
      <PageHeader
        title="Currency Settings"
        description="Manage supported currencies and exchange rates."
        icon={DollarSign}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Currency</Button>}
      />

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search currencies…" className="max-w-sm" />
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <NoData title="No currencies found" description="Add a new currency to get started." actionLabel="Add Currency" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <CurrencyFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Currency' : 'Add Currency'}
        initial={editRow}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Currency Details"
        description={viewRow?.currency_name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            {[
              { label: 'Code', value: viewRow.code },
              { label: 'Name', value: viewRow.currency_name },
              { label: 'Symbol', value: viewRow.symbol },
              { label: 'Exchange Rate', value: viewRow.exchange_rate },
              { label: 'Base', value: viewRow.is_base ? 'Yes' : 'No' },
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
        entityName={deleteRow?.code}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function CurrencyFormDrawer({ open, onOpenChange, title, initial, onSubmit }) {
  const [form, setForm] = useState({
    currency_name: '',
    symbol: '',
    code: '',
    exchange_rate: 1,
  })

  useEffect(() => {
    if (initial) {
      setForm({
        currency_name: initial.currency_name || '',
        symbol: initial.symbol || '',
        code: initial.code || '',
        exchange_rate: initial.exchange_rate ?? 1,
      })
    } else if (open) {
      // Reset form when opening for create new
      setForm({
        currency_name: '',
        symbol: '',
        code: '',
        exchange_rate: 1,
      })
    }
  }, [initial, open])

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Currency configuration"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Currency'}
          submitDisabled={!form.code.trim()}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency Code <span className="text-destructive">*</span></Label>
            <Input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="USD" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Symbol</Label>
            <Input value={form.symbol} onChange={(e) => set('symbol', e.target.value)} placeholder="$" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency Name</Label>
            <Input value={form.currency_name} onChange={(e) => set('currency_name', e.target.value)} placeholder="US Dollar" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Exchange Rate</Label>
            <Input type="number" step="0.01" value={form.exchange_rate} onChange={(e) => set('exchange_rate', parseFloat(e.target.value) || 0)} />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
