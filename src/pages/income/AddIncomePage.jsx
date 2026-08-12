// ====================================================================
// Module: Income
// Page: Add Income
//
// Purpose:
// Manage income records.
//
// Data Source:
// income.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { DollarSign, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { incomeService } from '@/services/income.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'income_head_name', label: 'Income Head' },
  { key: 'amount', label: 'Amount' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' },
  { key: 'createdAt', label: 'Created At' },
]

export default function AddIncomePage() {
  const { toast } = useToast()
  const { data: incomes, isLoading, refetch } = useAsyncData(() => incomeService.getIncomes(), [])
  const { data: heads, isLoading: headsLoading } = useAsyncData(() => incomeService.getIncomeHeads(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = incomes || []
  const allHeads = heads || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const head = allHeads.find(h => h._id === r.income_head_id)
    return !q || 
      (head?.income_head_name || '').toLowerCase().includes(q) ||
      (r.note || '').toLowerCase().includes(q)
  }), [rows, search, allHeads])

  const stats = useMemo(() => ({
    total: rows.length,
    totalAmount: rows.reduce((sum, r) => sum + (r.amount || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'income_head_id',
      header: 'Income Head',
      cell: ({ row }) => {
        const head = allHeads.find(h => h._id === row.original.income_head_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{head?.income_head_name || 'Unknown'}</span>
          </button>
        )
      },
    },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => `₹${(row.original.amount || 0).toLocaleString()}` },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
    { accessorKey: 'note', header: 'Note', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.note || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allHeads])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await incomeService.updateIncome(id, payload)
        toast({ title: 'Income updated successfully' })
        setEditRow(null)
      } else {
        await incomeService.createIncome(payload)
        toast({ title: 'Income created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save income:', error)
      toast({ title: 'Failed to save income', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await incomeService.deleteIncome(id)
      toast({ title: 'Income deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete income:', error)
      toast({ title: 'Failed to delete income', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Income' }, { label: 'Add Income' }]} />
      <PageHeader
        title="Add Income"
        description="Manage income records."
        icon={DollarSign}
        actions={<Button onClick={() => setAddOpen(true)}><DollarSign className="mr-2 h-4 w-4" /> Add Income</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Records" value={stats.total} icon={DollarSign} accent="primary" />
        <StatCard label="Total Amount" value={`₹${stats.totalAmount.toLocaleString()}`} icon={DollarSign} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by income head or note…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              income_head_name: allHeads.find(h => h._id === r.income_head_id)?.income_head_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="income" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No income records found" description="Add an income to get started." actionLabel="Add Income" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Income' : 'Add Income'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update income details' : 'Add a new income record'}</DialogDescription>
          </DialogHeader>
          <IncomeForm initial={editRow} heads={allHeads} headsLoading={headsLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Income Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const head = allHeads.find(h => h._id === viewRow.income_head_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Income Head', value: head?.income_head_name || 'Unknown' },
                { label: 'Amount', value: `₹${(viewRow.amount || 0).toLocaleString()}` },
                { label: 'Date', value: viewRow.date ? formatDate(viewRow.date) : '—' },
                { label: 'Note', value: viewRow.note || '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Income</DialogTitle>
            <DialogDescription>Are you sure you want to delete this income? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteRow._id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IncomeForm({ initial, heads, headsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    income_head_id: '', amount: '', date: '', note: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        income_head_id: initial.income_head_id || '', amount: initial.amount || '', date: initial.date ? initial.date.split('T')[0] : '', note: initial.note || '',
      })
    } else {
      setFormData({
        income_head_id: heads.length > 0 ? heads[0]._id : '', amount: '', date: new Date().toISOString().split('T')[0], note: '',
      })
    }
  }, [initial, heads])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, amount: Number(formData.amount) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="income_head_id">Income Head *</Label>
        <select id="income_head_id" value={formData.income_head_id} onChange={(e) => setFormData({ ...formData, income_head_id: e.target.value })} disabled={headsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select income head</option>
          {heads.map((h) => (
            <option key={h._id} value={h._id}>{h.income_head_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="amount">Amount *</Label>
        <Input id="amount" type="number" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Additional notes..." rows={3} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
