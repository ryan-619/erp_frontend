// ====================================================================
// Module: Academics
// Page: Class Timetable
//
// Purpose:
// Manage class timetable entries.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, CalendarClock, Pencil, Trash2, Eye, BookOpen } from 'lucide-react'
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
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useClassTimetable } from '@/hooks/useAcademics'
import { academicsService } from '@/services/academics.service'
import apiClient from '@/services/api'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "class_name", label: "Class" },
  { key: "section_name", label: "Section" },
  { key: "subject_name", label: "Subject" },
  { key: "teacher_name", label: "Teacher" },
  { key: "day", label: "Day" },
  { key: "period", label: "Period" },
  { key: "start_time", label: "Start Time" },
  { key: "end_time", label: "End Time" },
]

export default function ClassTimetablePage() {
  const { toast } = useToast()
  const { rows, stats, isLoading, search, setSearch, saveTimetable, deleteTimetable } = useClassTimetable()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [subjectOptions, setSubjectOptions] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])

  // Fixed options for form dropdowns (users need all options to create entries)
  const FORM_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const FORM_PERIODS = [
    { id: 1, label: 'Period 1' },
    { id: 2, label: 'Period 2' },
    { id: 3, label: 'Period 3' },
    { id: 4, label: 'Period 4' },
    { id: 5, label: 'Period 5' },
    { id: 6, label: 'Period 6' },
    { id: 7, label: 'Period 7' },
    { id: 8, label: 'Period 8' },
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          classRes,
          sectionRes,
          subjectRes,
          teacherRes,
        ] = await Promise.all([
          academicsService.classes(),
          academicsService.sections(),
          academicsService.subjects(),
          apiClient.get("/hr/staff-directory"),
        ])

        setClassOptions(classRes || [])
        setSectionOptions(sectionRes || [])
        setSubjectOptions(subjectRes || [])
        setTeacherOptions(teacherRes || [])
      } catch (err) {
        console.log(err)
      }
    }

    loadData()
  }, [])

  // Build lookup maps for efficient ID resolution
  const classMap = useMemo(() => {
    const map = {}
    classOptions.forEach(c => map[c._id] = c)
    return map
  }, [classOptions])

  const sectionMap = useMemo(() => {
    const map = {}
    sectionOptions.forEach(s => map[s._id] = s)
    return map
  }, [sectionOptions])

  const subjectMap = useMemo(() => {
    const map = {}
    subjectOptions.forEach(s => map[s._id] = s)
    return map
  }, [subjectOptions])

  const teacherMap = useMemo(() => {
    const map = {}
    teacherOptions.forEach(t => map[t._id] = t)
    return map
  }, [teacherOptions])

  const columns = useMemo(() => [
    {
      accessorKey: "class_id",
      header: "Class",
      cell: ({ row }) => {
        const cls = classMap[row.original.class_id]
        const section = sectionMap[row.original.section_id]
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{cls?.class_name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{section?.section_name || 'Unknown'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "subject_id",
      header: "Subject",
      cell: ({ row }) => {
        const subject = subjectMap[row.original.subject_id]
        return subject?.subject_name || row.original.subject_id
      },
    },
    {
      accessorKey: "teacher_id",
      header: "Teacher",
      cell: ({ row }) => {
        const teacher = teacherMap[row.original.teacher_id]
        return teacher?.name || row.original.teacher_id
      },
    },
    {
      accessorKey: "day",
      header: "Day",
    },
    {
      accessorKey: "period",
      header: "Period",
    },
    {
      accessorKey: "start_time",
      header: "Start Time",
    },
    {
      accessorKey: "end_time",
      header: "End Time",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ], [classMap, sectionMap, subjectMap, teacherMap])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Class Timetable' }]} />
      <PageHeader
        title="Class Timetable"
        description="Manage class schedule entries."
        icon={CalendarClock}
        actions={
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Entry</Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Entries"
          value={stats.total}
          icon={CalendarClock}
          accent="primary"
        />

        <StatCard
          label="Showing"
          value={rows.length}
          icon={BookOpen}
          accent="success"
        />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search timetable…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={rows.map(r => ({
              ...r,
              class_name: classMap[r.class_id]?.class_name || r.class_id,
              section_name: sectionMap[r.section_id]?.section_name || r.section_id,
              subject_name: subjectMap[r.subject_id]?.subject_name || r.subject_id,
              teacher_name: teacherMap[r.teacher_id]?.name || r.teacher_id,
              period: r.period,
            }))} 
            columns={EXPORT_COLS} 
            filename="class-timetable" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={9} />
      ) : rows.length === 0 ? (
        <NoData title="No timetable entries found" actionLabel="Add Entry" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="class-timetable"
          bulkActions={[{ label: 'Delete', icon: Trash2, variant: 'destructive', onClick: (ids) => { ids.forEach((id) => deleteTimetable(id)) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <TimetableDrawer open={addOpen} onOpenChange={setAddOpen} title="Add Timetable Entry" classOptions={classOptions} sectionOptions={sectionOptions} subjectOptions={subjectOptions} teacherOptions={teacherOptions} days={FORM_DAYS} periods={FORM_PERIODS} onSubmit={async (p) => { await saveTimetable(p); setAddOpen(false) }} />
      <TimetableDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Timetable Entry" initial={editRow} classOptions={classOptions} sectionOptions={sectionOptions} subjectOptions={subjectOptions} teacherOptions={teacherOptions} days={FORM_DAYS} periods={FORM_PERIODS} onSubmit={async (p) => { await saveTimetable(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Timetable Entry Details" description={subjectMap[viewRow?.subject_id]?.subject_name || 'Unknown'} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Class", value: classMap[viewRow.class_id]?.class_name || 'Unknown' },
              { label: "Section", value: sectionMap[viewRow.section_id]?.section_name || 'Unknown' },
              { label: "Subject", value: subjectMap[viewRow.subject_id]?.subject_name || 'Unknown' },
              { label: "Teacher", value: teacherMap[viewRow.teacher_id]?.name || 'Unknown' },
              { label: "Day", value: viewRow.day },
              { label: "Start Time", value: viewRow.start_time },
              { label: "End Time", value: viewRow.end_time },
              { label: "Created", value: formatDate(viewRow.createdAt) },
            ].map((r) => (
              <div key={r.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={subjectMap[deleteRow?.subject_id]?.subject_name || 'Unknown'}
        onConfirm={() => { deleteTimetable(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function TimetableDrawer({ open, onOpenChange, title, initial, classOptions = [], sectionOptions = [], subjectOptions = [], teacherOptions = [], days = [], periods = [], onSubmit }) {
  const [form, setForm] = useState({
    class_id: initial?.class_id || '',
    section_id: initial?.section_id || '',
    subject_id: initial?.subject_id || '',
    teacher_id: initial?.teacher_id || '',
    day: initial?.day || 'Monday',
    period: initial?.period || 1,
    start_time: initial?.start_time || '',
    end_time: initial?.end_time || '',
  })

  useEffect(() => {
    setForm({
      class_id: initial?.class_id || '',
      section_id: initial?.section_id || '',
      subject_id: initial?.subject_id || '',
      teacher_id: initial?.teacher_id || '',
      day: initial?.day || 'Monday',
      period: initial?.period || 1,
      start_time: initial?.start_time || '',
      end_time: initial?.end_time || '',
    })
  }, [initial])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description="Timetable entry details" width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save' : 'Create'} onSubmit={() => onSubmit(form)} />}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Class <span className="text-destructive">*</span></Label>
            <select value={form.class_id} onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select class</option>
              {classOptions.map((c) => <option key={c._id} value={c._id}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Section <span className="text-destructive">*</span></Label>
            <select value={form.section_id} onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select section</option>
              {sectionOptions.map((s) => <option key={s._id} value={s._id}>{s.section_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Subject <span className="text-destructive">*</span></Label>
            <select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select subject</option>
              {subjectOptions.map((s) => <option key={s._id} value={s._id}>{s.subject_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Teacher <span className="text-destructive">*</span></Label>
            <select value={form.teacher_id} onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select teacher</option>
              {teacherOptions.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Day <span className="text-destructive">*</span></Label>
            <select value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Period <span className="text-destructive">*</span></Label>
            <select value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: parseInt(e.target.value) }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start Time <span className="text-destructive">*</span></Label>
            <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End Time <span className="text-destructive">*</span></Label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} required />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}