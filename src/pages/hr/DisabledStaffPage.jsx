// ====================================================================
// Module: Human Resources
// Page: Disabled Staff
//
// Purpose:
// View and manage disabled staff records.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Ban, Eye, RotateCcw, Trash2, UserX, Power, Pencil, Plus } from 'lucide-react'
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

const EXPORT_COLS = [
  { key: 'staff_name', label: 'Staff Name' },
  { key: 'reason', label: 'Reason' },
  { key: 'date', label: 'Disabled Date' },
  { key: 'createdAt', label: 'Created At' },
]

export default function DisabledStaffPage() {
  const { toast } = useToast()
  const { data: disabledStaff, isLoading, refetch } = useAsyncData(() => hrService.getDisabledStaff(), [])
  const { data: staffList, isLoading: staffLoading } = useAsyncData(() => hrService.getStaff(), [])
  
  const [search, setSearch] = useState('')
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = disabledStaff || []
  const staff = staffList || []

  const filtered = useMemo(() => rows.filter((r) => {
    const staffMember = staff.find(s => s._id === r.staff_id)
    const q = search.toLowerCase()
    return !q || (staffMember?.name || '').toLowerCase().includes(q)
  }), [rows, search, staff])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'staff_id',
      header: 'Staff Member',
      cell: ({ row }) => {
        const staffMember = staff.find(s => s._id === row.original.staff_id)
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {initials(staffMember?.name || 'Unknown')}
            </div>
            <div>
              <p className="font-medium hover:underline">{staffMember?.name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{staffMember?.employee_id || '—'}</p>
            </div>
          </button>
        )
      },
    },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{row.original.reason || '—'}</span>
    ) },
    { accessorKey: 'date', header: 'Disabled Date', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [staff])

  const rowActions = (r) => [
    { label: 'View Details', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await hrService.updateDisabledStaff(id, payload)
        toast({ title: 'Disabled staff record updated' })
      } else {
        await hrService.createDisabledStaff(payload)
        toast({ title: 'Disabled staff record created' })
      }
      setEditRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to save disabled staff record:', error)
      toast({ title: 'Failed to save disabled staff record', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await hrService.deleteDisabledStaff(id)
      toast({ title: 'Disabled staff record deleted' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete disabled staff record:', error)
      toast({ title: 'Failed to delete disabled staff record', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Disabled Staff' }]} />
      <PageHeader
        title="Disabled Staff"
        description="View and manage disabled staff records."
        icon={Ban}
        actions={<Button onClick={() => setEditRow({})}><Plus className="mr-2 h-4 w-4" /> Add Disabled Staff</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard label="Total Disabled" value={stats.total} icon={Ban} accent="destructive" />
        <StatCard label="Total Active Staff" value={staff.length} icon={UserX} accent="chart2" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search staff name…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="disabled-staff" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData
          title="No disabled staff"
          description="Add disabled staff records to see them here."
          actionLabel="Add Disabled Staff"
          onAction={() => setEditRow({})}
          icon={Ban}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(member) => <ActionDropdown actions={rowActions(member)} />}
        />
      )}

      {/* View Staff Details Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Disabled Staff Details"
        width="sm:max-w-xl"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const staffMember = staff.find(s => s._id === viewRow.staff_id)
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {initials(staffMember?.name || 'Unknown')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{staffMember?.name || 'Unknown'}</h3>
                  <p className="text-sm text-muted-foreground">Employee ID: {staffMember?.employee_id || '—'}</p>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  { label: 'Reason', value: viewRow.reason || '—', className: 'sm:col-span-2' },
                  { label: 'Disabled Date', value: formatDate(viewRow.date) },
                  { label: 'Created', value: formatDate(viewRow.createdAt) },
                  { label: 'Updated', value: formatDate(viewRow.updatedAt) },
                ].map((f) => (
                  <div key={f.label} className={`space-y-0.5 ${f.className || ''}`}>
                    <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                    <dd className="text-sm font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })()}
      </Drawer>

      {/* Add/Edit Dialog */}
      <Dialog open={!!editRow} onOpenChange={(o) => { if (!o) setEditRow(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow?._id ? 'Edit Disabled Staff' : 'Add Disabled Staff'}</DialogTitle>
            <DialogDescription>{editRow?._id ? 'Update disabled staff record' : 'Add a new disabled staff record'}</DialogDescription>
          </DialogHeader>
          <DisabledStaffForm 
            initial={editRow} 
            staff={staff} 
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => setEditRow(null)} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Disabled Staff Record</DialogTitle>
            <DialogDescription>Are you sure you want to delete this disabled staff record? This action cannot be undone.</DialogDescription>
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

// ─── DisabledStaffForm Component ───────────────────────────────────────────────────────
function DisabledStaffForm({ initial, staff, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    staff_id: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (initial) {
      setFormData({
        staff_id: initial.staff_id || '',
        reason: initial.reason || '',
        date: initial.date ? initial.date.split('T')[0] : new Date().toISOString().split('T')[0],
      })
    } else {
      setFormData({
        staff_id: staff[0]?._id || '',
        reason: '',
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [initial, staff])

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
            <option key={s._id} value={s._id}>{s.name} ({s.employee_id || 'No ID'})</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="date">Disabled Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Provide a reason for disabling this staff member"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Record</Button>
      </DialogFooter>
    </form>
  )
}
