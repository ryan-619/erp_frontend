// ====================================================================
// Module: Human Resources
// Page: Approve Leave
//
// Purpose:
// Review and approve or reject staff leave applications.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { CalendarCheck, Clock, CircleCheck as CheckCircle2, Circle as XCircle, Check, X, Eye, FileText, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { hrService } from '@/services/hr.service'
import { formatDate, initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const EXPORT_COLS = [
  { key: 'staff_name', label: 'Staff Name' },
  { key: 'leave_type', label: 'Leave Type' },
  { key: 'from_date', label: 'From' },
  { key: 'to_date', label: 'To' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
]

const STATUS_PILL = {
  pending: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: Clock },
  approved: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: CheckCircle2 },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', icon: XCircle },
}

function LeaveStatusPill({ status }) {
  const s = STATUS_PILL[status] || STATUS_PILL.pending
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', s.bg, s.text, s.border)}>
      <Icon className="h-3 w-3" />{status}
    </span>
  )
}

export default function ApproveLeaveHRPage() {
  const { toast } = useToast()
  const { data: applyLeaves, isLoading, refetch } = useAsyncData(() => hrService.getApplyLeaves(), [])
  const { data: staffList, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  const { data: leaveTypes, isLoading: typesLoading } = useAsyncData(() => hrService.getLeaveTypes(), [])
  
  const [viewApp, setViewApp] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const allLeaves = applyLeaves || []
  const staff = staffList || []
  const types = leaveTypes || []

  const filtered = useMemo(() => allLeaves.filter((r) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || (staff.find(s => s._id === r.staff_id)?.name || '').toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter
    return matchesSearch && matchesStatus
  }), [allLeaves, search, statusFilter, staff])

  const stats = useMemo(() => ({
    total: allLeaves.length,
    pending: allLeaves.filter((l) => l.status === 'pending').length,
    approved: allLeaves.filter((l) => l.status === 'approved').length,
    rejected: allLeaves.filter((l) => l.status === 'rejected').length,
  }), [allLeaves])

  const columns = useMemo(() => [
    {
      accessorKey: 'staff_id',
      header: 'Staff Member',
      cell: ({ row }) => {
        const staffMember = staff.find(s => s._id === row.original.staff_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewApp(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {initials(staffMember?.name || 'Unknown')}
            </div>
            <div>
              <p className="font-medium hover:underline">{staffMember?.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{staffMember?.department_id || '—'}</p>
            </div>
          </button>
        )
      },
    },
    { accessorKey: 'leave_type_id', header: 'Leave Type', cell: ({ row }) => {
      const leaveType = types.find(t => t._id === row.original.leave_type_id)
      return <Badge variant="outline">{leaveType?.leave_type || 'Unknown'}</Badge>
    }},
    { accessorKey: 'from_date', header: 'From', cell: ({ row }) => formatDate(row.original.from_date) },
    { accessorKey: 'to_date', header: 'To', cell: ({ row }) => formatDate(row.original.to_date) },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[180px]">{row.original.reason || '—'}</span>
    ) },
    { accessorKey: 'createdAt', header: 'Applied On', cell: ({ row }) => formatDate(row.original.createdAt) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <LeaveStatusPill status={row.original.status} /> },
  ], [staff, types])

  const rowActions = (app) => [
    { label: 'View Details', icon: Eye, onClick: () => setViewApp(app) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(app) },
    { separator: true },
    { label: 'Approve', icon: Check, onClick: () => handleStatusUpdate(app._id, 'approved'), disabled: app.status === 'approved' },
    { label: 'Reject', icon: X, variant: 'destructive', onClick: () => handleStatusUpdate(app._id, 'rejected'), disabled: app.status === 'rejected' },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(app) },
  ]

  const handleStatusUpdate = async (id, status) => {
    try {
      await hrService.updateApplyLeave(id, { status })
      toast({ title: `Leave ${status}`, description: 'The leave application has been updated.' })
      refetch()
    } catch (error) {
      console.error('Failed to update leave status:', error)
      toast({ title: 'Failed to update leave status', variant: 'destructive' })
    }
  }

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hrService.updateApplyLeave(id, payload)
        toast({ title: 'Leave application updated' })
      } else {
        await hrService.createApplyLeave(payload)
        toast({ title: 'Leave application created' })
      }
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save leave application:', error)
      toast({ title: 'Failed to save leave application', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteApplyLeave(id)
      toast({ title: 'Leave application deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete leave application:', error)
      toast({ title: 'Failed to delete leave application', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Approve Leave' }]} />
      <PageHeader
        title="Approve Leave"
        description="Review and approve or reject staff leave applications."
        icon={CalendarCheck}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="destructive" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by staff name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="leave-applications" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <NoData title="No leave applications" description="No pending or past leave applications found." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(app) => <ActionDropdown actions={rowActions(app)} />}
        />
      )}

      {/* Leave Application Detail Drawer */}
      <Drawer
        open={!!viewApp}
        onOpenChange={(o) => !o && setViewApp(null)}
        title="Leave Application"
        description={viewApp ? `${staff.find(s => s._id === viewApp.staff_id)?.name || 'Unknown'}` : ''}
        width="sm:max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewApp(null)}>Close</Button>
            {viewApp?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={() => { handleStatusUpdate(viewApp._id, 'rejected'); setViewApp(null) }}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => { handleStatusUpdate(viewApp._id, 'approved'); setViewApp(null) }}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </>
        }
      >
        {viewApp && (() => {
          const leaveType = types.find(t => t._id === viewApp.leave_type_id)
          const staffMember = staff.find(s => s._id === viewApp.staff_id)
          const fromDate = new Date(viewApp.from_date)
          const toDate = new Date(viewApp.to_date)
          const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
          
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Staff Member', value: staffMember?.name || 'Unknown' },
                { label: 'Leave Type', value: <Badge variant="outline">{leaveType?.leave_type || 'Unknown'}</Badge> },
                { label: 'Days', value: `${days} day${days > 1 ? 's' : ''}` },
                { label: 'From', value: formatDate(viewApp.from_date) },
                { label: 'To', value: formatDate(viewApp.to_date) },
                { label: 'Applied On', value: formatDate(viewApp.createdAt) },
                { label: 'Status', value: <LeaveStatusPill status={viewApp.status} /> },
                { label: 'Reason', value: viewApp.reason || '—', className: 'sm:col-span-2' },
              ].map((f) => (
                <div key={f.label} className={`space-y-0.5 ${f.className || ''}`}>
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      {/* Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) setEditRow(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Leave Application</DialogTitle>
            <DialogDescription>Update the leave application details</DialogDescription>
          </DialogHeader>
          <LeaveForm 
            initial={editRow} 
            staff={staff} 
            leaveTypes={types} 
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => setEditRow(null)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Application</DialogTitle>
            <DialogDescription>Are you sure you want to delete this leave application? This action cannot be undone.</DialogDescription>
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

// ─── LeaveForm Component ───────────────────────────────────────────────────────
function LeaveForm({ initial, staff, leaveTypes, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type_id: '',
    from_date: '',
    to_date: '',
    reason: '',
    status: 'pending',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        staff_id: initial.staff_id || '',
        leave_type_id: initial.leave_type_id || '',
        from_date: initial.from_date ? initial.from_date.split('T')[0] : '',
        to_date: initial.to_date ? initial.to_date.split('T')[0] : '',
        reason: initial.reason || '',
        status: initial.status || 'pending',
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
        <Label htmlFor="staff_id">Staff Member *</Label>
        <select
          id="staff_id"
          value={formData.staff_id}
          onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select staff member</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="leave_type_id">Leave Type *</Label>
        <select
          id="leave_type_id"
          value={formData.leave_type_id}
          onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((t) => (
            <option key={t._id} value={t._id}>{t.leave_type}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from_date">From Date *</Label>
          <Input
            id="from_date"
            type="date"
            value={formData.from_date}
            onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="to_date">To Date *</Label>
          <Input
            id="to_date"
            type="date"
            value={formData.to_date}
            onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Provide a reason for the leave request"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  )
}
