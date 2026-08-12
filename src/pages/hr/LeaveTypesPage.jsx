// ====================================================================
// Module: Human Resources
// Page: Leave Types
//
// Purpose:
// Configure leave categories and annual limits.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, Tags, Pencil, Trash2, Eye, CircleCheck as CheckCircle2, CalendarDays } from 'lucide-react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'leave_type', label: 'Leave Type' },
  { key: 'days_allowed', label: 'Days Allowed' },
  { key: 'createdAt', label: 'Created At' },
]

export default function LeaveTypesPage() {
  const { toast } = useToast()
  const { data: leaveTypes, isLoading, refetch } = useAsyncData(() => hrService.getLeaveTypes(), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = leaveTypes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    return !q || (r.leave_type || '').toLowerCase().includes(q)
  }), [rows, search])

  const stats = useMemo(() => ({
    total: rows.length,
    totalDays: rows.reduce((s, r) => s + (r.days_allowed || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'leave_type',
      header: 'Leave Type',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <p className="font-medium hover:underline">{row.original.leave_type}</p>
        </button>
      ),
    },
    { accessorKey: 'days_allowed', header: 'Days / Year', cell: ({ row }) => (
      <span className="font-semibold">{row.original.days_allowed} days</span>
    ) },
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
        await hrService.updateLeaveType(id, payload)
        toast({ title: 'Leave type updated' })
      } else {
        await hrService.createLeaveType(payload)
        toast({ title: 'Leave type created' })
      }
      setAddOpen(false)
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save leave type:', error)
      toast({ title: 'Failed to save leave type', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteLeaveType(id)
      toast({ title: 'Leave type deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete leave type:', error)
      toast({ title: 'Failed to delete leave type', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Leave Types' }]} />
      <PageHeader
        title="Leave Types"
        description="Configure leave categories and annual limits."
        icon={Tags}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Leave Type</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard label="Total Types" value={stats.total} icon={Tags} accent="primary" />
        <StatCard label="Total Days / Year" value={stats.totalDays} icon={CheckCircle2} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search leave types…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="leave-types" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={3} />
      ) : filtered.length === 0 ? (
        <NoData title="No leave types found" actionLabel="Add Leave Type" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Leave Type' : 'Add Leave Type'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update leave type information' : 'Add a new leave type'}</DialogDescription>
          </DialogHeader>
          <LeaveTypeForm initial={editRow} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Leave Type Details"
        description={viewRow?.leave_type}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Leave Type', value: viewRow.leave_type },
              { label: 'Days Allowed / Year', value: `${viewRow.days_allowed} days` },
              { label: 'Created', value: formatDate(viewRow.createdAt) },
              { label: 'Updated', value: formatDate(viewRow.updatedAt) },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leave Type</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{deleteRow?.leave_type}"? This action cannot be undone.</DialogDescription>
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

// ─── LeaveTypeForm Component ───────────────────────────────────────────────────────
function LeaveTypeForm({ initial, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    leave_type: '',
    days_allowed: 12,
  })

  // Populate form when editing
  useEffect(() => {
    if (initial) {
      setFormData({
        leave_type: initial.leave_type || '',
        days_allowed: initial.days_allowed || 12,
      })
    } else {
      setFormData({
        leave_type: '',
        days_allowed: 12,
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
        <Label htmlFor="leave_type">Leave Type Name *</Label>
        <Input
          id="leave_type"
          value={formData.leave_type}
          onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
          placeholder="e.g., Sick Leave, Casual Leave"
          required
        />
      </div>
      <div>
        <Label htmlFor="days_allowed">Days Allowed Per Year *</Label>
        <Input
          id="days_allowed"
          type="number"
          min="0"
          value={formData.days_allowed}
          onChange={(e) => setFormData({ ...formData, days_allowed: parseInt(e.target.value) || 0 })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Leave Type</Button>
      </DialogFooter>
    </form>
  )
}
