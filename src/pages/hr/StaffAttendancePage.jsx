// ====================================================================
// Module: Human Resources
// Page: Staff Attendance
//
// Purpose:
// Mark and track daily attendance for all staff members.
//
// Data Source:
// hr.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { ClipboardCheck, Users, CircleCheck as CheckCircle2, Circle as XCircle, Clock3, Check, X, Eye, Printer, Trash2 } from 'lucide-react'
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
import { Drawer } from '@/components/Drawer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { hrService } from '@/services/hr.service'
import { initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const EXPORT_COLS = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'name', label: 'Name' },
  { key: 'department_id', label: 'Department' },
  { key: 'status', label: 'Status' },
  { key: 'in_time', label: 'Check-in' },
  { key: 'out_time', label: 'Check-out' },
]

// Map each attendance status to Tailwind styles for the pill
const STATUS_STYLES = {
  present: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  absent: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  late: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  'half-day': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  not_marked: { bg: 'bg-muted/10', text: 'text-muted-foreground', border: 'border-muted/20' },
}

function StatusPill({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.not_marked
  const displayStatus = status === 'not_marked' ? 'Not Marked' : status === 'half-day' ? 'Half Day' : status
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', s.bg, s.text, s.border)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {displayStatus}
    </span>
  )
}

export default function StaffAttendancePage() {
  const { toast } = useToast()
  const todayStr = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(todayStr)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  // Fetch all staff members
  const { data: staffData, isLoading: staffLoading, refetch: refetchStaff } = useAsyncData(
    () => hrService.getStaff(),
    []
  )

  // Fetch attendance from backend with date filter
  const { data: attendanceResponse, isLoading: attendanceLoading, refetch: refetchAttendance } = useAsyncData(
    async () => {
      const response = await hrService.getAttendance({ date })
      // Handle both array response and object with data property
      const allAttendanceData = Array.isArray(response) ? response : response?.data || []
      // Filter attendance by selected date
      const filteredAttendance = allAttendanceData.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return recordDate === date
      })
      return { data: filteredAttendance, pagination: response?.pagination || {} }
    },
    [date]
  )

  // Fetch departments and designations for name mapping
  const { data: deptData } = useAsyncData(() => hrService.getDepartments(), [])
  const { data: desigData } = useAsyncData(() => hrService.getDesignations(), [])

  const staff = staffData || []
  const attendanceData = attendanceResponse?.data || []
  const pagination = attendanceResponse?.pagination || {}
  const departments = deptData || []
  const designations = desigData || []

  const isLoading = staffLoading || attendanceLoading

  // Create ID to name mappings
  const departmentMap = useMemo(() => 
    Object.fromEntries(departments.map(d => [d._id, d.department_name])),
    [departments]
  )
  
  const designationMap = useMemo(() => 
    Object.fromEntries(designations.map(d => [d._id, d.designation_title])),
    [designations]
  )

  // Create staff ID to staff member mapping
  const staffMap = useMemo(() => 
    Object.fromEntries(staff.map(s => [s._id, s])),
    [staff]
  )

  // Create attendance ID to attendance record mapping
  const attendanceMap = useMemo(() => 
    Object.fromEntries(attendanceData.map(a => [a.staff_id, a])),
    [attendanceData]
  )

  // Merge staff with attendance data - show ALL staff with their attendance status
  const rows = useMemo(() => {
    const mergedRows = staff.map((staffMember) => {
      const attendanceRecord = attendanceMap[staffMember._id]
      const row = {
        ...staffMember,
        attendance_id: attendanceRecord?._id,
        status: attendanceRecord?.status || 'not_marked',
        in_time: attendanceRecord?.in_time || null,
        out_time: attendanceRecord?.out_time || null,
      }
      return row
    })
    return mergedRows
  }, [staff, attendanceMap])

  const deptFilterOptions = useMemo(() => 
    ['all', ...departments.map(d => d._id)],
    [departments]
  )

  const filtered = useMemo(() => rows.filter((r) => {
    const matchSearch = !search ||
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.employee_id || '').toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || r.department_id === deptFilter
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchDept && matchStatus
  }), [rows, search, deptFilter, statusFilter])

  const stats = useMemo(() => ({
    total: rows.length,
    present: rows.filter((r) => r.status === 'present').length,
    absent: rows.filter((r) => r.status === 'absent').length,
    late: rows.filter((r) => r.status === 'late').length,
    'half-day': rows.filter((r) => r.status === 'half-day').length,
    not_marked: rows.filter((r) => r.status === 'not_marked').length,
  }), [rows])

  // Create attendance for a staff member
  const createAttendance = async (row, status) => {
    try {
      // Set default times based on status
      let inTime = null
      let outTime = null
      
      if (status === 'present') {
        inTime = '09:00'
        outTime = '17:00'
      } else if (status === 'late') {
        inTime = '09:30'
        outTime = '17:00'
      } else if (status === 'half-day') {
        inTime = '09:00'
        outTime = '13:00'
      }

      await hrService.createAttendance({
        staff_id: row.staff_id || row._id,
        date: date,
        status: status,
        in_time: inTime,
        out_time: outTime,
      })

      toast({ title: 'Attendance marked', description: `${row.name} marked ${status}.` })
      refetchAttendance()
    } catch (error) {
      console.error('Failed to mark attendance:', error)
      toast({ title: 'Failed to mark attendance', variant: 'destructive' })
    }
  }

  // Update attendance
  const updateAttendance = async (attendanceId, payload) => {
    try {
      await hrService.updateAttendance(attendanceId, payload)
      toast({ title: 'Attendance updated', description: 'Attendance record updated successfully.' })
      setEditRow(null)
      refetchAttendance()
    } catch (error) {
      console.error('Failed to update attendance:', error)
      toast({ title: 'Failed to update attendance', variant: 'destructive' })
    }
  }

  // Delete attendance
  const deleteAttendance = async (attendanceId) => {
    try {
      await hrService.deleteAttendance(attendanceId)
      toast({ title: 'Attendance deleted', description: 'Attendance record deleted successfully.' })
      setDeleteRow(null)
      refetchAttendance()
    } catch (error) {
      console.error('Failed to delete attendance:', error)
      toast({ title: 'Failed to delete attendance', variant: 'destructive' })
    }
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Staff Member',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials(row.original.name)}
          </div>
          <div>
            <p className="font-medium hover:underline">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.employee_id}</p>
          </div>
        </button>
      ),
    },
    { 
      accessorKey: 'department_id', 
      header: 'Department',
      cell: ({ row }) => departmentMap[row.original.department_id] || row.original.department_id || 'N/A'
    },
    { 
      accessorKey: 'designation_id', 
      header: 'Designation',
      cell: ({ row }) => designationMap[row.original.designation_id] || row.original.designation_id || 'N/A'
    },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusPill status={row.original.status} /> },
    { accessorKey: 'in_time', header: 'Check-in', cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 text-sm"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" />{row.original.in_time || '—'}</span>
    ) },
    { accessorKey: 'out_time', header: 'Check-out', cell: ({ row }) => (
      <span className="text-sm">{row.original.out_time || '—'}</span>
    ) },
  ], [departmentMap, designationMap])

  const rowActions = (r) => {
    const hasAttendance = r.attendance_id
    return [
      ...(hasAttendance ? [
        { label: 'Edit', icon: Eye, onClick: () => setEditRow(r) },
        { label: 'Delete', icon: X, onClick: () => setDeleteRow(r), variant: 'destructive' },
      ] : [
        { label: 'Mark Present', icon: Check, onClick: () => createAttendance(r, 'present') },
        { label: 'Mark Absent', icon: X, onClick: () => createAttendance(r, 'absent') },
        { label: 'Mark Late', icon: Clock3, onClick: () => createAttendance(r, 'late') },
        { label: 'Mark Half Day', icon: Clock3, onClick: () => createAttendance(r, 'half-day') },
      ]),
      { separator: true },
      { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    ]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Human Resources' }, { label: 'Staff Attendance' }]} />
      <PageHeader
        title="Staff Attendance"
        description="Mark and track daily staff attendance across all departments."
        icon={ClipboardCheck}
        actions={<Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>}
      />

      {/* Quick stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Staff" value={stats.total} icon={Users} accent="primary" />
        <StatCard label="Present" value={stats.present} icon={CheckCircle2} accent="success" />
        <StatCard label="Absent" value={stats.absent} icon={XCircle} accent="destructive" />
        <StatCard label="Late" value={stats.late} icon={Clock3} accent="warning" />
        <StatCard label="Half Day" value={stats['half-day']} icon={Clock3} accent="muted" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name or employee ID…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename={`staff-attendance-${date}`} />
          {/* Date picker — changing date triggers re-fetch */}
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 w-auto" />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option key="all" value="all">All departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.department_name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option key="all" value="all">All statuses</option>
            <option key="present" value="present">Present</option>
            <option key="absent" value="absent">Absent</option>
            <option key="late" value="late">Late</option>
            <option key="half-day" value="half-day">Half Day</option>
            <option key="not_marked" value="not_marked">Not Marked</option>
          </select>
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No staff found" description="No staff records found for the selected filters." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* View Details Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Attendance Details"
        description={viewRow?.name}
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: 'Employee', value: viewRow.name },
              { label: 'Employee ID', value: viewRow.employee_id },
              { label: 'Department', value: departmentMap[viewRow.department_id] || viewRow.department_id || 'N/A' },
              { label: 'Designation', value: designationMap[viewRow.designation_id] || viewRow.designation_id || 'N/A' },
              { label: 'Date', value: date },
              { label: 'Status', value: <StatusPill status={viewRow.status} /> },
              { label: 'Check-in', value: viewRow.in_time || '—' },
              { label: 'Check-out', value: viewRow.out_time || '—' },
            ].map((f) => (
              <div key={f.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                <dd className="text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      {/* Edit Attendance Dialog */}
      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
            <DialogDescription>Edit attendance for {editRow?.name}</DialogDescription>
          </DialogHeader>
          {editRow && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  value={editRow.status}
                  onChange={(e) => setEditRow({ ...editRow, status: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half-day">Half Day</option>
                </select>
              </div>
              <div>
                <Label>Check-in Time</Label>
                <Input
                  type="time"
                  value={editRow.in_time || ''}
                  onChange={(e) => setEditRow({ ...editRow, in_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Check-out Time</Label>
                <Input
                  type="time"
                  value={editRow.out_time || ''}
                  onChange={(e) => setEditRow({ ...editRow, out_time: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
            <Button onClick={() => updateAttendance(editRow.attendance_id, {
              status: editRow.status,
              in_time: editRow.in_time,
              out_time: editRow.out_time,
            })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Attendance</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the attendance record for {deleteRow?.name} on {date}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRow(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteAttendance(deleteRow.attendance_id)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
