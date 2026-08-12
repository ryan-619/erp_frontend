// ====================================================================
// Module: Homework
// Page: Daily Assignments
//
// Purpose:
// Manage daily student assignments.
//
// Data Source:
// homework.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { ClipboardList, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { homeworkService } from '@/services/homework.service'
import { hrService } from '@/services/hr.service'
import { studentService } from '@/services/student.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'student_name', label: 'Student' },
  { key: 'teacher_name', label: 'Teacher' },
  { key: 'date', label: 'Date' },
  { key: 'task', label: 'Task' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created At' },
]

export default function DailyAssignmentPage() {
  const { toast } = useToast()
  const { data: assignments, isLoading, refetch } = useAsyncData(() => homeworkService.getDailyAssignments(), [])
  const { data: teachers, isLoading: teachersLoading } = useAsyncData(() => hrService.getStaff(), [])
  const { data: students, isLoading: studentsLoading } = useAsyncData(() => studentService.list(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = assignments || []
  const allTeachers = teachers || []
  const allStudents = students || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const teacher = allTeachers.find(t => t._id === r.teacher_id)
    const student = allStudents.find(s => s._id === r.student_id)
    const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
    let studentName = 'Unknown'
    if (student) {
      if (typeof student === 'string') {
        studentName = student
      } else if (student?.name) {
        const firstName = student.name.first || ''
        const lastName = student.name.last || ''
        studentName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
      } else {
        studentName = student?.full_name || student?.first_name || student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown'
      }
    }
    return !q || 
      teacherName.toLowerCase().includes(q) ||
      studentName.toLowerCase().includes(q) ||
      (r.task || '').toLowerCase().includes(q)
  }), [rows, search, allTeachers, allStudents])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'task',
      header: 'Task',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline line-clamp-1 max-w-xs">{row.original.task || 'No task'}</span>
            <span className="text-xs text-muted-foreground">{row.original.date ? formatDate(row.original.date) : 'No date'}</span>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'student_id',
      header: 'Student',
      cell: ({ row }) => {
        const student = allStudents.find(s => s._id === row.original.student_id)
        let studentName = 'Unknown'
        if (student) {
          if (typeof student === 'string') {
            studentName = student
          } else if (student?.name) {
            const firstName = student.name.first || ''
            const lastName = student.name.last || ''
            studentName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
          } else {
            studentName = student?.full_name || student?.first_name || student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown'
          }
        }
        return <Badge variant="secondary">{studentName}</Badge>
      },
    },
    {
      accessorKey: 'teacher_id',
      header: 'Teacher',
      cell: ({ row }) => {
        const teacher = allTeachers.find(t => t._id === row.original.teacher_id)
        const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
        return <span className="text-sm">{teacherName}</span>
      },
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => row.original.date ? formatDate(row.original.date) : '—' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'completed' ? 'default' : 'secondary'}>{row.original.status || 'Pending'}</Badge> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allStudents, allTeachers])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await homeworkService.updateDailyAssignment(id, payload)
        toast({ title: 'Assignment updated successfully' })
        setEditRow(null)
      } else {
        await homeworkService.createDailyAssignment(payload)
        toast({ title: 'Assignment created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save assignment:', error)
      toast({ title: 'Failed to save assignment', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await homeworkService.deleteDailyAssignment(id)
      toast({ title: 'Assignment deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete assignment:', error)
      toast({ title: 'Failed to delete assignment', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Homework' }, { label: 'Daily Assignments' }]} />
      <PageHeader
        title="Daily Assignments"
        description="Manage daily student assignments."
        icon={ClipboardList}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Assignment</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Assignments" value={stats.total} icon={ClipboardList} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student, teacher, or task…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              const teacher = allTeachers.find(t => t._id === r.teacher_id)
              const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
              const student = allStudents.find(s => s._id === r.student_id)
              let studentName = 'Unknown'
              if (student) {
                if (typeof student === 'string') {
                  studentName = student
                } else if (student?.name) {
                  const firstName = student.name.first || ''
                  const lastName = student.name.last || ''
                  studentName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
                } else {
                  studentName = student?.full_name || student?.first_name || student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown'
                }
              }
              return {
                ...r,
                teacher_name: teacherName,
                student_name: studentName,
              }
            })} 
            columns={EXPORT_COLS} 
            filename="daily-assignments" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No assignments found" description="Add an assignment to get started." actionLabel="Add Assignment" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update assignment details' : 'Add a new daily assignment'}</DialogDescription>
          </DialogHeader>
          <AssignmentForm initial={editRow} teachers={allTeachers} students={allStudents} teachersLoading={teachersLoading} studentsLoading={studentsLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Assignment Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const teacher = allTeachers.find(t => t._id === viewRow.teacher_id)
          const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
          const student = allStudents.find(s => s._id === viewRow.student_id)
          let studentName = 'Unknown'
          if (student) {
            if (typeof student === 'string') {
              studentName = student
            } else if (student?.name) {
              const firstName = student.name.first || ''
              const lastName = student.name.last || ''
              studentName = firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unknown'
            } else {
              studentName = student?.full_name || student?.first_name || student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown'
            }
          }
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Task', value: viewRow.task || '—' },
                { label: 'Student', value: studentName },
                { label: 'Teacher', value: teacherName },
                { label: 'Date', value: viewRow.date ? formatDate(viewRow.date) : '—' },
                { label: 'Status', value: viewRow.status || 'Pending' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
                { label: 'Updated', value: formatDate(viewRow.updatedAt) },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">{f.label}</dt>
                  <dd className="text-sm font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          )
        })()}
      </Drawer>

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>Are you sure you want to delete this assignment? This action cannot be undone.</DialogDescription>
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

function AssignmentForm({ initial, teachers, students, teachersLoading, studentsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    student_id: '', teacher_id: '', date: '', task: '', status: 'pending',
  })

  useState(() => {
    if (initial) {
      setFormData({
        student_id: initial.student_id || '', teacher_id: initial.teacher_id || '', date: initial.date ? initial.date.split('T')[0] : '', task: initial.task || '', status: initial.status || 'pending',
      })
    } else {
      setFormData({
        student_id: students.length > 0 ? students[0]._id : '', teacher_id: teachers.length > 0 ? teachers[0]._id : '', date: new Date().toISOString().split('T')[0], task: '', status: 'pending',
      })
    }
  }, [initial, students, teachers])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unnamed'
    if (typeof teacher === 'string') return teacher
    return teacher?.full_name || teacher?.name || teacher?.first_name || teacher?.employee_id || 'Unnamed'
  }

  const getStudentName = (student) => {
    if (!student) return 'Unnamed'
    if (typeof student === 'string') return student
    // Handle nested name object from student service
    if (student?.name) {
      const firstName = student.name.first || ''
      const lastName = student.name.last || ''
      return firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Unnamed'
    }
    return student?.full_name || student?.first_name || student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unnamed'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student_id">Student *</Label>
        <select id="student_id" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} disabled={studentsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select student</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>{getStudentName(s)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="teacher_id">Teacher *</Label>
        <select id="teacher_id" value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })} disabled={teachersLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select teacher</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>{getTeacherName(t)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="task">Task *</Label>
        <Textarea id="task" value={formData.task} onChange={(e) => setFormData({ ...formData, task: e.target.value })} placeholder="Assignment task..." rows={3} required />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
