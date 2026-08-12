// ====================================================================
// Module: Human Resources
// Page: Apply Leave
//
// Purpose:
// Allow staff to submit leave applications and track their status.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { CalendarPlus, Eye, Clock, CircleCheck as CheckCircle2, Circle as XCircle, FileText, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

// Reused by both the table and the detail drawer so status pills stay consistent.
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

export default function ApplyLeavePage() {
  const { toast } = useToast()
  const { data: applyLeaves, isLoading: leavesLoading, refetch } = useAsyncData(() => hrService.getApplyLeaves(), [])
  const { data: staffList, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  const { data: leaveTypes, isLoading: typesLoading } = useAsyncData(() => hrService.getLeaveTypes(), [])
  
  const [viewApp, setViewApp] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const allLeaves = applyLeaves || []
  const staff = staffList || []
  const types = leaveTypes || []

  const stats = useMemo(() => ({
    total: allLeaves.length,
    pending: allLeaves.filter((l) => l.status === 'pending').length,
    approved: allLeaves.filter((l) => l.status === 'approved').length,
    rejected: allLeaves.filter((l) => l.status === 'rejected').length,
  }), [allLeaves])

  const columns = useMemo(() => [
    { accessorKey: 'leave_type_id', header: 'Leave Type', cell: ({ row }) => {
      const leaveType = types.find(t => t._id === row.original.leave_type_id)
      return <Badge variant="outline">{leaveType?.leave_type || 'Unknown'}</Badge>
    }},
    { accessorKey: 'staff_id', header: 'Staff', cell: ({ row }) => {
      const staffMember = staff.find(s => s._id === row.original.staff_id)
      return <span className="text-sm">{staffMember?.name || 'Unknown'}</span>
    }},
    { accessorKey: 'from_date', header: 'From', cell: ({ row }) => formatDate(row.original.from_date) },
    { accessorKey: 'to_date', header: 'To', cell: ({ row }) => formatDate(row.original.to_date) },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[220px]">{row.original.reason || '—'}</span>
    ) },
    { accessorKey: 'createdAt', header: 'Applied On', cell: ({ row }) => formatDate(row.original.createdAt) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <LeaveStatusPill status={row.original.status} /> },
  ], [staff, types])

  const rowActions = (app) => [
    { label: 'View Details', icon: Eye, onClick: () => setViewApp(app) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(app) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(app) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hrService.updateApplyLeave(id, payload)
        toast({ title: 'Leave application updated' })
      } else {
        await hrService.createApplyLeave(payload)
        toast({ title: 'Leave application submitted', description: 'Your request has been sent for approval.' })
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
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Apply Leave' }]} />
      <PageHeader
        title="Apply Leave"
        description="Submit a leave application and track its approval status."
        icon={CalendarPlus}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application form — left column on large screens. */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <h3 className="text-lg font-semibold">Submit Leave Application</h3>
            <ApplyLeaveForm
              staff={staff}
              leaveTypes={types}
              staffLoading={staffLoading}
              typesLoading={typesLoading}
              submitting={submitting}
              initial={editRow}
              onSubmit={async (payload) => {
                setSubmitting(true)
                await handleSave(payload, editRow?._id)
                setSubmitting(false)
                if (!editRow) {
                  // Reset form only if adding
                }
              }}
              onCancel={() => setEditRow(null)}
            />
          </div>
        </div>

        {/* History table — right column, wider. */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={stats.total} icon={FileText} accent="primary" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} accent="warning" />
            <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="success" />
            <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="destructive" />
          </div>

          {leavesLoading ? (
            <LoadingSkeleton variant="table" rows={5} cols={7} />
          ) : allLeaves.length === 0 ? (
            <NoData title="No applications yet" description="Your submitted leave applications will appear here." />
          ) : (
            <DataTable
              columns={columns}
              data={allLeaves}
              rowActions={(app) => <ActionDropdown actions={rowActions(app)} />}
            />
          )}
        </div>
      </div>

      {/* Detail drawer for viewing a past application. */}
      <Drawer
        open={!!viewApp}
        onOpenChange={(o) => !o && setViewApp(null)}
        title="Leave Application"
        description={viewApp ? `Application ID: ${viewApp._id}` : ''}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewApp(null)}>Close</Button>}
      >
        {viewApp && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {(() => {
              const leaveType = types.find(t => t._id === viewApp.leave_type_id)
              const staffMember = staff.find(s => s._id === viewApp.staff_id)
              const fromDate = new Date(viewApp.from_date)
              const toDate = new Date(viewApp.to_date)
              const days = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1
              
              return [
                { label: 'Leave Type', value: <Badge variant="outline">{leaveType?.leave_type || 'Unknown'}</Badge> },
                { label: 'Staff Member', value: staffMember?.name || 'Unknown' },
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
              ))
            })()}
          </dl>
        )}
      </Drawer>

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

// ─── ApplyLeaveForm Component ───────────────────────────────────────────────────────
function ApplyLeaveForm({ staff, leaveTypes, staffLoading, typesLoading, submitting, initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    staff_id: '',
    leave_type_id: '',
    from_date: '',
    to_date: '',
    reason: '',
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        staff_id: initial.staff_id || '',
        leave_type_id: initial.leave_type_id || '',
        from_date: initial.from_date ? initial.from_date.split('T')[0] : '',
        to_date: initial.to_date ? initial.to_date.split('T')[0] : '',
        reason: initial.reason || '',
      })
    } else {
      setFormData({
        staff_id: staff[0]?._id || '',
        leave_type_id: leaveTypes[0]?._id || '',
        from_date: '',
        to_date: '',
        reason: '',
      })
    }
  }, [initial, staff, leaveTypes])

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
          disabled={staffLoading}
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
          disabled={typesLoading}
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
          placeholder="Provide a reason for your leave request"
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Submitting...' : initial ? 'Update Application' : 'Submit Application'}
      </Button>
      {initial && (
        <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
          Cancel Edit
        </Button>
      )}
    </form>
  )
}
