// ====================================================================
// Module: Front Office
// Page: Phone Call Log
//
// Purpose:
// Manage phone call records.
//
// Data Source:
// frontOffice.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Phone, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'call_type', label: 'Call Type' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'date', label: 'Date' },
  { key: 'note', label: 'Note' },
]

export default function PhoneCallLogPage() {
  const { toast } = useToast()
  const { data: calls, isLoading, refetch } = useAsyncData(() => frontOfficeService.getCallLogs(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = calls || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.name || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.purpose || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    incoming: rows.filter((r) => r.call_type === 'incoming').length,
    outgoing: rows.filter((r) => r.call_type === 'outgoing').length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Contact',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Phone className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{row.original.phone || 'No phone'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'call_type', header: 'Type', cell: ({ row }) => <Badge variant={row.original.call_type === 'incoming' ? 'default' : 'secondary'}>{row.original.call_type || 'Unknown'}</Badge> },
    { accessorKey: 'purpose', header: 'Purpose', cell: ({ row }) => row.original.purpose || '—' },
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
        await frontOfficeService.updateCallLog(id, payload)
        toast({ title: 'Call log updated successfully' })
        setEditRow(null)
      } else {
        await frontOfficeService.createCallLog(payload)
        toast({ title: 'Call log created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save call log:', error)
      toast({ title: 'Failed to save call log', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontOfficeService.deleteCallLog(id)
      toast({ title: 'Call log deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete call log:', error)
      toast({ title: 'Failed to delete call log', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front Office' }, { label: 'Phone Call Log' }]} />
      <PageHeader
        title="Phone Call Log"
        description="Manage phone call records."
        icon={Phone}
        actions={<Button onClick={() => setAddOpen(true)}><Phone className="mr-2 h-4 w-4" /> Add Call Log</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Calls" value={stats.total} icon={Phone} accent="primary" />
        <StatCard label="Incoming" value={stats.incoming} icon={Phone} accent="default" />
        <StatCard label="Outgoing" value={stats.outgoing} icon={Phone} accent="secondary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, phone, or purpose…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="phone-call-log" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No call logs found" description="Add a call log to get started." actionLabel="Add Call Log" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Call Log' : 'Add Call Log'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update call log details' : 'Add a new phone call record'}</DialogDescription>
          </DialogHeader>
          <CallLogForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Call Log Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Name', value: viewRow.name || '—' },
              { label: 'Phone', value: viewRow.phone || '—' },
              { label: 'Call Type', value: viewRow.call_type || 'Unknown' },
              { label: 'Purpose', value: viewRow.purpose || '—' },
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
            <DialogTitle>Delete Call Log</DialogTitle>
            <DialogDescription>Are you sure you want to delete this call log? This action cannot be undone.</DialogDescription>
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

function CallLogForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    call_type: 'incoming', name: '', phone: '', purpose: '', date: '', note: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        call_type: initial.call_type || 'incoming', name: initial.name || '', phone: initial.phone || '', purpose: initial.purpose || '', date: initial.date ? initial.date.split('T')[0] : '', note: initial.note || '',
      })
    } else {
      setFormData({
        call_type: 'incoming', name: '', phone: '', purpose: '', date: new Date().toISOString().split('T')[0], note: '',
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
        <Label htmlFor="call_type">Call Type *</Label>
        <select id="call_type" value={formData.call_type} onChange={(e) => setFormData({ ...formData, call_type: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>
      </div>
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="purpose">Purpose *</Label>
        <Input id="purpose" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} required />
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
