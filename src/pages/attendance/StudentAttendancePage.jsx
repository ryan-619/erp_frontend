// ====================================================================
// Module: Attendance
// Page: Student Attendance
//
// Purpose:
// Track and manage daily student attendance records.
//
// Data Source:
// attendance.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Clock, CheckCircle2, XCircle, Plus, Eye, Pencil, Trash2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { FilterBar } from '@/components/FilterBar'
import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { ImportButton } from '@/components/ImportButton'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useStudentAttendance } from '@/hooks/useAttendance'
import { studentService } from '@/services/student.service'
import { academicsService } from '@/services/academics.service'
import { formatDate, initials } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "student_name", label: "Student Name" },
  { key: "roll_number", label: "Roll No" },
  { key: "class_name", label: "Class" },
  { key: "section", label: "Section" },
  { key: "status", label: "Status" },
  { key: "attendance_date", label: "Date" },
]

export default function StudentAttendancePage() {
  const { toast } = useToast()
  const {
    rows: filtered,
    stats,
    isLoading,
    search, setSearch,
    status, setStatus,
    classFilter, setClassFilter,
    sectionFilter, setSectionFilter,
    date, setDate,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    
  } = useStudentAttendance()

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

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

        setClassOptions(classes)
        setSectionOptions(sections)
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

  const handleCreate = async (createForm) => {
    console.log("Create Payload:", createForm)
    await createAttendance(createForm)
    setAddOpen(false)
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "student_id",
        header: "Student",
        cell: ({ row }) => {
          const student =
            typeof row.original.student_id === "object"
              ? row.original.student_id
              : studentOptions.find(
                  (s) => s._id === row.original.student_id
                ) || {}

          const studentName = student?.name
            ? `${student.name.first || ""} ${student.name.last || ""}`
            : "Unknown"

          return (
            <button
              onClick={() => setViewRow(row.original)}
              className="flex items-center gap-3 text-left"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(studentName)}
              </div>
              <div>
                <p className="font-medium hover:underline">{studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {student.roll_number || "—"}
                </p>
              </div>
            </button>
          )
        },
      },
      {
        accessorKey: "class_id",
        header: "Class",
        cell: ({ row }) => {
          const classObj = classMap[row.original.class_id]
          return classObj?.class_name || "—"
        },
      },
      {
        accessorKey: "section",
        header: "Section",
        cell: ({ row }) => row.original.section || "—",
      },
      {
        accessorKey: "attendance_date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.attendance_date),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [studentOptions, classMap]
  )

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance', to: '/attendance' }, { label: 'Student Attendance' }]} />
      
      <PageHeader
        title="Student Attendance"
        description="Track and manage daily student attendance records."
        icon={CalendarCheck}
        actions={
          <>
            <ImportButton onImport={() => toast({ title: 'Import started' })} />
            <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Record</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Records" value={stats.total} icon={Layers} accent="primary" />
        <StatCard label="Present" value={stats.present} icon={CheckCircle2} accent="success" />
        <StatCard label="Absent" value={stats.absent} icon={XCircle} accent="destructive" />
        <StatCard label="Late" value={stats.late} icon={Clock} accent="warning" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search student name..." className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons
            rows={filtered.map((r) => {
              const student =
                typeof r.student_id === "object"
                  ? r.student_id
                  : studentOptions.find((s) => s._id === r.student_id)

              const classObj = classOptions.find(
                (c) => c._id === r.class_id
              )

              return {
                ...r,
                student_name: student
                  ? `${student.name?.first || ""} ${student.name?.last || ""}`
                  : "Unknown",

                roll_number: student?.roll_number || "-",

                class_name: classObj?.class_name || "-",

                section: r.section,

                status: r.status,

                attendance_date: formatDate(r.attendance_date),
              }
            })}
            columns={EXPORT_COLS}
            filename="student-attendance"
          />

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
          </select>

          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All classes</option>
            {classOptions.map((c) => (
              <option key={c._id} value={c._id}>{c.class_name}</option>
            ))}
          </select>

          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" aria-label="Attendance date" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No attendance records found" actionLabel="Add Record" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableSelection
          enableExport
          exportFilename="student-attendance"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <AttendanceDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Mark Attendance"
        classOptions={classOptions}
        studentOptions={studentOptions}
        onSubmit={handleCreate}
      />

      <AttendanceDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Attendance"
        initial={editRow}
        classOptions={classOptions}
        studentOptions={studentOptions}
        onSubmit={async (payload) => {
          await updateAttendance(editRow._id, payload)
          setEditRow(null)
        }}
      />

      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Attendance Details"
        description={
          viewRow?.student_id?.name
            ? `${viewRow.student_id.name.first} ${viewRow.student_id.name.last}`
            : "Attendance Details"
        }
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow ? (() => {
          const student =
            typeof viewRow.student_id === "object"
              ? viewRow.student_id
              : studentOptions.find(
                  (s) => s._id === viewRow.student_id
                ) || {}

          const studentName = student?.name
            ? `${student.name.first || ""} ${student.name.last || ""}`
            : "Unknown"

          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: "Student Name", value: studentName },
                { label: "Roll Number", value: student.roll_number || "N/A" },
                { label: "Class", value: classMap[viewRow.class_id]?.class_name || "N/A" },
                { label: "Section", value: viewRow.section || "N/A" },
                { label: "Date", value: formatDate(viewRow.attendance_date) },
                { label: "Status", value: <StatusBadge status={viewRow.status} /> },
                { label: "Remarks", value: viewRow.remarks || "None" },
              ].map((r) => (
                <div key={r.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                  <dd className="text-sm font-medium">{r.value}</dd>
                </div>
              ))}
            </dl>
          )
        })() : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName="Attendance Record"
        onConfirm={() => {
          deleteAttendance(deleteRow._id)
          setDeleteRow(null)
        }}
      />
    </div>
  )
}

function AttendanceDrawer({ open, onOpenChange, title, initial, classOptions, studentOptions, onSubmit }) {
  const [form, setForm] = useState({
    student_id: '',
    class_id: '',
    section: 'A',
    attendance_date: new Date().toISOString().split('T')[0],
    status: 'present',
    remarks: '',
  })

  useEffect(() => {
    if (initial) {
      setForm({
        student_id: typeof initial.student_id === 'object' ? initial.student_id._id : initial.student_id || '',
        class_id: initial.class_id || '',
        section: initial.section || 'A',
        attendance_date: initial.attendance_date ? new Date(initial.attendance_date).toISOString().split('T')[0] : '',
        status: initial.status || 'present',
        remarks: initial.remarks || '',
      })
    } else {
      setForm({
        student_id: '',
        class_id: '',
        section: 'A',
        attendance_date: new Date().toISOString().split('T')[0],
        status: 'present',
        remarks: '',
      })
    }
  }, [initial, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Enter attendance details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? "Update" : "Save"}
          onSubmit={handleSubmit}
        />
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-2">
            <Label>Student <span className="text-destructive">*</span></Label>
            <select
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Select Student</option>
              {studentOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name?.first} {s.name?.last} ({s.roll_number || 'No Roll'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Class <span className="text-destructive">*</span></Label>
            <select
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Select Class</option>
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.class_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Date <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={form.attendance_date}
              onChange={(e) => setForm({ ...form, attendance_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status <span className="text-destructive">*</span></Label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input
              value={form.remarks}
              placeholder="Optional remarks..."
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
            />
          </div>
        </FormSection>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  )
}