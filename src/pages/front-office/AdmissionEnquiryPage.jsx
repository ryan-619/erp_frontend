// ====================================================================
// Module: Front Office
// Page: Admission Enquiry
//
// Purpose:
// Track prospective student enquiries.
//
// Data Source:
// frontOffice.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { UserPlus, Eye, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  { key: 'student_name', label: 'Student Name' },
  { key: 'class_seeking', label: 'Class Seeking' },
  { key: 'parent_name', label: 'Parent Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'enquiry_date', label: 'Enquiry Date' },
  { key: 'status', label: 'Status' },
]

export default function AdmissionEnquiryPage() {
  const { toast } = useToast()
  const { data: enquiries, isLoading, refetch } = useAsyncData(() => frontOfficeService.getEnquiries(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = enquiries || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || 
      (r.student_name || '').toLowerCase().includes(q) ||
      (r.parent_name || '').toLowerCase().includes(q) ||
      (r.class_seeking || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    contacted: rows.filter((r) => r.status === 'contacted').length,
    converted: rows.filter((r) => r.status === 'converted').length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'student_name',
      header: 'Student',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.student_name || 'Unknown'}</span>
            <span className="text-xs text-muted-foreground">{row.original.class_seeking || 'No class'}</span>
          </div>
        </button>
      ),
    },
    { accessorKey: 'parent_name', header: 'Parent', cell: ({ row }) => row.original.parent_name || '—' },
    { accessorKey: 'phone', header: 'Phone', cell: ({ row }) => row.original.phone || '—' },
    { accessorKey: 'enquiry_date', header: 'Enquiry Date', cell: ({ row }) => row.original.enquiry_date ? formatDate(row.original.enquiry_date) : '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'converted' ? 'default' : 'secondary'}>{row.original.status || 'Pending'}</Badge> },
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
        await frontOfficeService.updateEnquiry(id, payload)
        toast({ title: 'Enquiry updated successfully' })
        setEditRow(null)
      } else {
        await frontOfficeService.createEnquiry(payload)
        toast({ title: 'Enquiry created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save enquiry:', error)
      toast({ title: 'Failed to save enquiry', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await frontOfficeService.deleteEnquiry(id)
      toast({ title: 'Enquiry deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete enquiry:', error)
      toast({ title: 'Failed to delete enquiry', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Front Office' }, { label: 'Admission Enquiry' }]} />
      <PageHeader
        title="Admission Enquiry"
        description="Track prospective student enquiries."
        icon={UserPlus}
        actions={<Button onClick={() => setAddOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Add Enquiry</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={UserPlus} accent="primary" />
        <StatCard label="Pending" value={stats.pending} icon={UserPlus} accent="secondary" />
        <StatCard label="Contacted" value={stats.contacted} icon={UserPlus} accent="default" />
        <StatCard label="Converted" value={stats.converted} icon={UserPlus} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student, parent, class, or phone…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="admission-enquiries" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No enquiries found" description="Add an enquiry to get started." actionLabel="Add Enquiry" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Enquiry' : 'Add Enquiry'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update enquiry details' : 'Add a new admission enquiry'}</DialogDescription>
          </DialogHeader>
          <EnquiryForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Enquiry Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Student Name', value: viewRow.student_name || '—' },
              { label: 'Class Seeking', value: viewRow.class_seeking || '—' },
              { label: 'Parent Name', value: viewRow.parent_name || '—' },
              { label: 'Phone', value: viewRow.phone || '—' },
              { label: 'Email', value: viewRow.email || '—' },
              { label: 'Enquiry Date', value: viewRow.enquiry_date ? formatDate(viewRow.enquiry_date) : '—' },
              { label: 'Status', value: viewRow.status || 'Pending' },
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
            <DialogTitle>Delete Enquiry</DialogTitle>
            <DialogDescription>Are you sure you want to delete this enquiry? This action cannot be undone.</DialogDescription>
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

function EnquiryForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_name: '', class_seeking: '', parent_name: '', phone: '', email: '', enquiry_date: '', status: 'pending',
  })

  useState(() => {
    if (initial) {
      setFormData({
        student_name: initial.student_name || '', class_seeking: initial.class_seeking || '', parent_name: initial.parent_name || '', phone: initial.phone || '', email: initial.email || '', enquiry_date: initial.enquiry_date ? initial.enquiry_date.split('T')[0] : '', status: initial.status || 'pending',
      })
    } else {
      setFormData({
        student_name: '', class_seeking: '', parent_name: '', phone: '', email: '', enquiry_date: new Date().toISOString().split('T')[0], status: 'pending',
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
        <Label htmlFor="student_name">Student Name *</Label>
        <Input id="student_name" value={formData.student_name} onChange={(e) => setFormData({ ...formData, student_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="class_seeking">Class Seeking *</Label>
        <Input id="class_seeking" value={formData.class_seeking} onChange={(e) => setFormData({ ...formData, class_seeking: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="parent_name">Parent Name *</Label>
        <Input id="parent_name" value={formData.parent_name} onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="enquiry_date">Enquiry Date *</Label>
        <Input id="enquiry_date" type="date" value={formData.enquiry_date} onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
