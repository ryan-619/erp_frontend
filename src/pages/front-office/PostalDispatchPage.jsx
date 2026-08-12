// ====================================================================
// Module: Front Office
// Page: Postal Dispatch
//
// Purpose:
// Manage postal dispatch records.
//
// Data Source:
// frontOffice.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Send, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { frontOfficeService } from '@/services/frontOffice.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'to_title', label: 'To Title' },
  { key: 'reference_no', label: 'Reference No' },
  { key: 'address', label: 'Address' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' },
]

export default function PostalDispatchPage() {
  const { toast } = useToast()
  const { data: dispatches, isLoading, refetch } = useAsyncData(() => frontOfficeService.getDispatches(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = dispatches || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.to_title || '').toLowerCase().includes(q) ||
      (r.reference_no || '').toLowerCase().includes(q) ||
      (r.address || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'to_title',
      header: 'To',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Send className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.to_title || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{row.original.reference_no || 'No ref'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'address', header: 'Address', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.address || '—'}</span> },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await frontOfficeService.updateDispatch(id, payload)
        toast({ title: 'Dispatch updated successfully' })
        setEditRow(null)
      } else {
        await frontOfficeService.createDispatch(payload)
        toast({ title: 'Dispatch created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save dispatch:', error)
      toast({ title: 'Failed to save dispatch', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontOfficeService.deleteDispatch(id)
      toast({ title: 'Dispatch deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete dispatch:', error)
      toast({ title: 'Failed to delete dispatch', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front Office' }, { label: 'Postal Dispatch' }]} />
      <PageHeader
        title="Postal Dispatch"
        description="Manage postal dispatch records."
        icon={Send}
        actions={<Button onClick={() => setAddOpen(true)}><Send className="mr-2 h-4 w-4" /> Add Dispatch</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Dispatches" value={stats.total} icon={Send} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, reference, or address…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="postal-dispatch" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No dispatches found" description="Add a dispatch to get started." actionLabel="Add Dispatch" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Dispatch' : 'Add Dispatch'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update dispatch details' : 'Add a new postal dispatch'}</DialogDescription>
          </DialogHeader>
          <DispatchForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Dispatch Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'To Title', value: viewRow.to_title || '—' },
              { label: 'Reference No', value: viewRow.reference_no || '—' },
              { label: 'Address', value: viewRow.address || '—' },
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
        )}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dispatch</DialogTitle>
            <DialogDescription>Are you sure you want to delete this dispatch? This action cannot be undone.</DialogDescription>
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

function DispatchForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    to_title: '', reference_no: '', address: '', date: '', note: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        to_title: initial.to_title || '', reference_no: initial.reference_no || '', address: initial.address || '', date: initial.date ? initial.date.split('T')[0] : '', note: initial.note || '',
      })
    } else {
      setFormData({
        to_title: '', reference_no: '', address: '', date: new Date().toISOString().split('T')[0], note: '',
      })
    }
  }, [initial])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="to_title">To Title *</Label>
        <Input id="to_title" value={formData.to_title} onChange={(e) => setFormData({ ...formData, to_title: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="reference_no">Reference No *</Label>
        <Input id="reference_no" value={formData.reference_no} onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="address">Address *</Label>
        <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Full address..." rows={3} required />
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
