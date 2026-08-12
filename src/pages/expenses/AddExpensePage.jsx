// ====================================================================
// Module: Expenses
// Page: Add Expense
//
// Purpose:
// Manage expense records (amount, date, head, note).
//
// Data Source:
// expenses.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import {
  TrendingDown,
  Plus,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react'
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
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { StatusBadge } from '@/components/StatusBadge'
import { useExpenses } from '@/hooks/useExpenses'
import { formatCurrency, formatDate } from '@/utils/format'

const EXPORT_COLS = [
  { key: 'expense_head_name', label: 'Expense Head' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' },
]

export default function AddExpensePage() {
  const {
    rows, expenseHeads, stats, isLoading,
    search, setSearch, headFilter, setHeadFilter,
    saveExpense, deleteExpense,
  } = useExpenses()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const handleSave = async (payload, id) => {
    await saveExpense(payload, id)
    if (id) setEditRow(null)
    else setAddOpen(false)
  }

  const handleDelete = async () => {
    await deleteExpense(deleteRow._id)
    setDeleteRow(null)
  }

  // Create a mapping of expense head IDs to names
  const headMap = useMemo(() => {
    return expenseHeads.reduce((map, head) => {
      map[head._id] = head.expense_head_name
      return map
    }, {})
  }, [expenseHeads])

  const columns = useMemo(() => [
    {
      accessorKey: 'expense_head_id',
      header: 'Expense Head',
      cell: ({ row }) => {
        const headName = headMap[row.original.expense_head_id] || 'Unknown'
        return (
          <button className="text-left hover:underline" onClick={() => setViewRow(row.original)}>
            <span className="font-medium">{headName}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.amount)}</span>,
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.date)}</span> },
    { accessorKey: 'note', header: 'Note', cell: ({ row }) => <span className="text-muted-foreground">{row.original.note || '—'}</span> },
  ], [headMap])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Expenses' }, { label: 'Add Expense' }]} />
      <PageHeader
        title="Add Expense"
        description="Manage expense records with amounts, dates, and notes."
        icon={TrendingDown}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Expenses" value={formatCurrency(stats.total)} accent="destructive" />
        <StatCard label="This Month" value={formatCurrency(stats.thisMonth)} accent="primary" />
        <StatCard label="Entries" value={stats.entries} accent="chart2" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by head or note…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={rows} columns={EXPORT_COLS} filename="expenses" />
          <select value={headFilter} onChange={(e) => setHeadFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All heads</option>
            {expenseHeads.map((h) => <option key={h._id} value={h._id}>{h.expense_head_name}</option>)}
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No expense records found" description="Add a new expense record to get started." actionLabel="Add Expense" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="expenses"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Reusable Expense Form Drawer used for both Add and Edit. */}
      <ExpenseFormDrawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        title={editRow ? 'Edit Expense' : 'Add Expense'}
        initial={editRow}
        expenseHeads={expenseHeads}
        onSubmit={(payload) => handleSave(payload, editRow?._id)}
      />

      {/* Detail drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Expense Details"
        description={headMap[viewRow?.expense_head_id] || 'Unknown'}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex-1">
                <p className="font-semibold">{headMap[viewRow.expense_head_id] || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(viewRow.amount)}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'Amount', value: formatCurrency(viewRow.amount) },
                { label: 'Date', value: formatDate(viewRow.date) },
                { label: 'Note', value: viewRow.note || '—' },
                { label: 'Created On', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={headMap[deleteRow?.expense_head_id] || 'Expense'}
        onConfirm={handleDelete}
      />
    </div>
  )
}

// ─── Expense Form Drawer (shared by Add and Edit) ───────────────────────────
function ExpenseFormDrawer({ open, onOpenChange, title, initial, expenseHeads, onSubmit }) {
  const [form, setForm] = useState({
    expense_head_id: initial?.expense_head_id || '',
    amount: initial?.amount || 0,
    date: initial?.date || new Date().toISOString().slice(0, 10),
    note: initial?.note || '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Expense record information"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save Changes' : 'Add Expense'}
          submitDisabled={!form.expense_head_id || !form.amount}
          onSubmit={() => onSubmit(form)}
        />
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Expense Head <span className="text-destructive">*</span></Label>
            <select value={form.expense_head_id} onChange={(e) => set('expense_head_id', e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select expense head</option>
              {expenseHeads.map((h) => (
                <option key={h._id} value={h._id}>{h.expense_head_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Amount <span className="text-destructive">*</span></Label>
              <Input type="number" min="0" value={form.amount} onChange={(e) => set('amount', parseFloat(e.target.value) || 0)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Input value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional note" />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}
