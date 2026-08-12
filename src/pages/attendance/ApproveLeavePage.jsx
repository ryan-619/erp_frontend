// ====================================================================
// Module: Attendance
// Page: Approve Leave
//
// Purpose:
// Review and approve student leave applications.
//
// Data Source:
// attendance.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Clock, CircleCheck as CheckCircle2, Circle as XCircle, Check, X, Eye, FileText, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useLeaveApprovals } from '@/hooks/useAttendance'
import { studentService } from '@/services/student.service'
import { academicsService } from '@/services/academics.service'
import { LEAVE_STATUS_OPTIONS } from '@/constants/navigation'
import { formatDate, initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const STAGE_STYLE = {
  pending: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20', icon: Clock },
  approved: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', icon: CheckCircle2 },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20', icon: XCircle },
}

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'from_date', label: 'From' },
  { key: 'to_date', label: 'To' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Applied On' },
]

function LeaveStatusPill({ status }) {
  const s = STAGE_STYLE[status] || STAGE_STYLE.pending
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize', s.bg, s.text, s.border)}>
      <Icon className="h-3 w-3" />{status}
    </span>
  )
}

export default function ApproveLeavePage() {
  const { toast } = useToast()
  const {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    classFilter, setClassFilter,
    sectionFilter, setSectionFilter,
    fromDate, setFromDate,
    toDate, setToDate,
    approveLeave,
    rejectLeave,
  } = useLeaveApprovals()
  const [viewApp, setViewApp] = useState(null)
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [studentOptions, setStudentOptions] = useState([])

  const classMap = useMemo(
    () =>
      Object.fromEntries(
        classOptions.map((c) => [c._id, c])
      ),
    [classOptions]
  )

  useEffect(() => {
    let mounted = true
    Promise.all([
      academicsService.classes(),
      academicsService.sections(),
      studentService.list({
        page: 1,
        limit: 100,
      }),
    ])
      .then(([clsRes, secRes, studentRes]) => {
        if (!mounted) return
        const classes = clsRes || []
        const sections = secRes || []
        const students = Array.isArray(studentRes)
          ? studentRes
          : studentRes?.data || []
        
        setClassOptions(classes.map((c) => c.class_name))
        setSectionOptions(Array.from(new Set(sections.map((s) => s.section_name))))
        setStudentOptions(students)
      })
      .catch(() => {
        if (!mounted) return
        setClassOptions([])
        setSectionOptions([])
        setStudentOptions([])
      })
    return () => { mounted = false }
  }, [])

  const handleApprove = async (app) => {
    await approveLeave(app)
  }

  const handleReject = async (app) => {
    await rejectLeave(app)
  }

  const columns = useMemo(() => [
    {
      accessorKey: 'student_id',
      header: 'Student',
      cell: ({ row }) => {
        const student =
          typeof row.original.student_id === "object"
            ? row.original.student_id
            : studentOptions.find(
                (s) => s._id === row.original.student_id
              ) || {}

        const studentName = student?.name
          ? `${student.name.first} ${student.name.last}`
          : 'Unknown'

        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewApp(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initials(studentName)}
            </div>
            <div>
              <p className="font-medium hover:underline">{studentName}</p>
              <p className="text-xs text-muted-foreground">{student.roll_number || '—'}</p>
            </div>
          </button>
        )
      },
    },
    { accessorKey: 'from_date', header: 'From', cell: ({ row }) => formatDate(row.original.from_date) },
    { accessorKey: 'to_date', header: 'To', cell: ({ row }) => formatDate(row.original.to_date) },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{row.original.reason}</span> },
    { accessorKey: 'createdAt', header: 'Applied On', cell: ({ row }) => formatDate(row.original.createdAt) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <LeaveStatusPill status={row.original.status} /> },
  ], [studentOptions])

  const rowActions = (app) => [
    { label: 'View Application', icon: Eye, onClick: () => setViewApp(app) },
    { label: 'Approve', icon: Check, onClick: () => handleApprove(app), disabled: app.status === 'approved' },
    { label: 'Reject', icon: X, variant: 'destructive', onClick: () => handleReject(app), disabled: app.status === 'rejected' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance', to: '/attendance' }, { label: 'Approve Leave' }]} />
      <PageHeader
        title="Approve Leave"
        description="Review and approve student leave applications."
        icon={CalendarCheck}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={stats.total} icon={FileText} accent="primary" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="warning" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="success" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="destructive" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student or admission no…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              const student =
                typeof r.student_id === "object"
                  ? r.student_id
                  : studentOptions.find((s) => s._id === r.student_id) || {}
              const studentName = student?.name
                ? `${student.name.first} ${student.name.last}`
                : 'Unknown'

              return {
                ...r,
                student_name: studentName,
                from_date: formatDate(r.from_date),
                to_date: formatDate(r.to_date),
                reason: r.reason,
                status: r.status,
                createdAt: formatDate(r.createdAt),
              }
            })} 
            columns={EXPORT_COLS} 
            filename="leave-applications" 
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All statuses</option>
            {LEAVE_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All classes</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All sections</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" aria-label="From date" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" aria-label="To date" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <NoData title="No leave applications found" description="Try adjusting your filters or date range." />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableSelection
          enableExport
          exportFilename="leave-applications"
          bulkActions={[
            { label: 'Approve', icon: Check, onClick: (sel) => { sel.forEach((a) => handleApprove(a)) } },
            { label: 'Reject', icon: X, variant: 'destructive', onClick: (sel) => { sel.forEach((a) => handleReject(a)) } },
          ]}
          rowActions={(app) => <ActionDropdown actions={rowActions(app)} />}
        />
      )}

      <Drawer
        open={!!viewApp}
        onOpenChange={(o) => !o && setViewApp(null)}
        title="Leave Application"
        description={
          viewApp?.student_id?.name
            ? `${viewApp.student_id.name.first} ${viewApp.student_id.name.last}`
            : "Attendance Details"
        }
        width="sm:max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewApp(null)}>Close</Button>
            {viewApp?.status === 'pending' ? (
              <>
                <Button variant="outline" onClick={() => { handleReject(viewApp); setViewApp(null) }}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => { handleApprove(viewApp); setViewApp(null) }}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            ) : null}
          </>
        }
      >
        {viewApp ? (() => {
          const student =
            typeof viewApp.student_id === "object"
              ? viewApp.student_id
              : studentOptions.find(
                  (s) => s._id === viewApp.student_id
                ) || {}
          
          const studentName = student?.name
            ? `${student.name.first} ${student.name.last}`
            : 'Unknown'

          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(studentName)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{studentName}</p>
                  <p className="text-xs text-muted-foreground">{student.admission_no || student.roll_number || '—'} · {classMap[viewApp.class_id]?.class_name || 'N/A'}</p>
                </div>
                <LeaveStatusPill status={viewApp.status} />
              </div>

              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  { label: 'Leave Type', value: <Badge variant="outline">{viewApp.leave_type || 'N/A'}</Badge> },
                  { label: 'From', value: formatDate(viewApp.from_date || viewApp.from) },
                  { label: 'To', value: formatDate(viewApp.to_date || viewApp.to) },
                  { label: 'Applied On', value: formatDate(viewApp.createdAt || viewApp.applied_on) },
                  { label: 'Guardian', value: viewApp.guardian || 'N/A' },
                  { label: 'Status', value: <LeaveStatusPill status={viewApp.status} /> },
                ].map((r) => (
                  <div key={r.label} className="space-y-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                    <dd className="text-sm font-medium">{r.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Reason</p>
                <p className="rounded-lg border bg-muted/20 p-3 text-sm">{viewApp.reason}</p>
              </div>

              {viewApp.attachment ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{viewApp.attachment}</span>
                  <Button variant="ghost" size="sm" className="ml-auto" onClick={() => toast({ title: 'Opening attachment' })}>View</Button>
                </div>
              ) : null}
            </div>
          )
        })() : null}
      </Drawer>
    </div>
  )
}