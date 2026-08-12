// ====================================================================
// Module: Lesson Plan
// Page: Lesson Plans
//
// Purpose:
// Manage lesson plans.
//
// Data Source:
// lesson.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { BookOpen, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { lessonService } from '@/services/lesson.service'
import { academicsService } from '@/services/academics.service'
import { hrService } from '@/services/hr.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'teacher_name', label: 'Teacher' },
  { key: 'subject_name', label: 'Subject' },
  { key: 'class_name', label: 'Class' },
  { key: 'date', label: 'Date' },
  { key: 'objectives', label: 'Objectives' },
  { key: 'methodology', label: 'Methodology' },
  { key: 'createdAt', label: 'Created At' },
]

export default function ManageLessonPlanPage() {
  const { toast } = useToast()
  const { data: lessonPlans, isLoading, refetch } = useAsyncData(() => lessonService.getLessonPlans(), [])
  const { data: teachers, isLoading: teachersLoading } = useAsyncData(() => hrService.getStaff(), [])
  const { data: subjects, isLoading: subjectsLoading } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes, isLoading: classesLoading } = useAsyncData(() => academicsService.classes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = lessonPlans || []
  const allTeachers = teachers || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const teacher = allTeachers.find(t => t._id === r.teacher_id)
    const subject = allSubjects.find(s => s._id === r.subject_id)
    const cls = allClasses.find(c => c._id === r.class_id)
    const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
    return !q || 
      teacherName.toLowerCase().includes(q) ||
      (subject?.subject_name || '').toLowerCase().includes(q) ||
      (cls?.class_name || '').toLowerCase().includes(q) ||
      (r.objectives || '').toLowerCase().includes(q)
  }), [rows, search, allTeachers, allSubjects, allClasses])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'teacher_id',
      header: 'Teacher',
      cell: ({ row }) => {
        const teacher = allTeachers.find(t => t._id === row.original.teacher_id)
        const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-medium hover:underline">{teacherName}</span>
          </button>
        )
      },
    },
    {
      accessorKey: 'subject_id',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = allSubjects.find(s => s._id === row.original.subject_id)
        return <Badge variant="secondary">{subject?.subject_name || 'Unknown'}</Badge>
      },
    },
    {
      accessorKey: 'class_id',
      header: 'Class',
      cell: ({ row }) => {
        const cls = allClasses.find(c => c._id === row.original.class_id)
        return <Badge variant="outline">{cls?.class_name || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'objectives', header: 'Objectives', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.objectives || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allTeachers, allSubjects, allClasses])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await lessonService.updateLessonPlan(id, payload)
        toast({ title: 'Lesson plan updated successfully' })
        setEditRow(null)
      } else {
        await lessonService.createLessonPlan(payload)
        toast({ title: 'Lesson plan created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save lesson plan:', error)
      toast({ title: 'Failed to save lesson plan', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await lessonService.deleteLessonPlan(id)
      toast({ title: 'Lesson plan deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete lesson plan:', error)
      toast({ title: 'Failed to delete lesson plan', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Lesson Plan' }, { label: 'Lesson Plans' }]} />
      <PageHeader
        title="Lesson Plans"
        description="Manage lesson plans."
        icon={BookOpen}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Lesson Plan</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Lesson Plans" value={stats.total} icon={BookOpen} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by teacher, subject, class, or objectives…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => {
              const teacher = allTeachers.find(t => t._id === r.teacher_id)
              const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
              return {
                ...r,
                teacher_name: teacherName,
                subject_name: allSubjects.find(s => s._id === r.subject_id)?.subject_name || 'Unknown',
                class_name: allClasses.find(c => c._id === r.class_id)?.class_name || 'Unknown',
              }
            })} 
            columns={EXPORT_COLS} 
            filename="lesson-plans" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No lesson plans found" description="Add a lesson plan to get started." actionLabel="Add Lesson Plan" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen || !!editRow} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editRow ? 'Edit Lesson Plan' : 'Add Lesson Plan'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update lesson plan details' : 'Add a new lesson plan'}</DialogDescription>
          </DialogHeader>
          <LessonPlanForm 
            initial={editRow} 
            teachers={allTeachers}
            subjects={allSubjects}
            classes={allClasses}
            teachersLoading={teachersLoading}
            subjectsLoading={subjectsLoading}
            classesLoading={classesLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Lesson Plan Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const teacher = allTeachers.find(t => t._id === viewRow.teacher_id)
          const teacherName = !teacher ? 'Unknown' : typeof teacher === 'string' ? teacher : teacher?.full_name || teacher?.name || teacher?.first_name || 'Unknown'
          const subject = allSubjects.find(s => s._id === viewRow.subject_id)
          const cls = allClasses.find(c => c._id === viewRow.class_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Teacher', value: teacherName },
                { label: 'Subject', value: subject?.subject_name || 'Unknown' },
                { label: 'Class', value: cls?.class_name || 'Unknown' },
                { label: 'Date', value: formatDate(viewRow.date) },
                { label: 'Objectives', value: viewRow.objectives || '—' },
                { label: 'Methodology', value: viewRow.methodology || '—' },
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lesson Plan</DialogTitle>
            <DialogDescription>Are you sure you want to delete this lesson plan? This action cannot be undone.</DialogDescription>
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

function LessonPlanForm({ initial, teachers, subjects, classes, teachersLoading, subjectsLoading, classesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    class_id: '',
    date: '',
    objectives: '',
    methodology: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        teacher_id: initial.teacher_id || '',
        subject_id: initial.subject_id || '',
        class_id: initial.class_id || '',
        date: initial.date ? initial.date.split('T')[0] : '',
        objectives: initial.objectives || '',
        methodology: initial.methodology || '',
      })
    } else {
      setFormData({
        teacher_id: teachers.length > 0 ? teachers[0]._id : '',
        subject_id: subjects.length > 0 ? subjects[0]._id : '',
        class_id: classes.length > 0 ? classes[0]._id : '',
        date: new Date().toISOString().split('T')[0],
        objectives: '',
        methodology: '',
      })
    }
  }, [initial, teachers, subjects, classes])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getTeacherName = (teacher) => {
    if (!teacher) return 'Unnamed'
    if (typeof teacher === 'string') return teacher
    return teacher?.full_name || teacher?.name || teacher?.first_name || teacher?.employee_id || 'Unnamed'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="teacher_id">Teacher *</Label>
        <select
          id="teacher_id"
          value={formData.teacher_id}
          onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
          disabled={teachersLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select teacher</option>
          {teachers.map((t) => (
            <option key={t._id} value={t._id}>{getTeacherName(t)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="subject_id">Subject *</Label>
        <select
          id="subject_id"
          value={formData.subject_id}
          onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
          disabled={subjectsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.subject_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="class_id">Class *</Label>
        <select
          id="class_id"
          value={formData.class_id}
          onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
          disabled={classesLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.class_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="objectives">Objectives</Label>
        <Textarea
          id="objectives"
          value={formData.objectives}
          onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
          placeholder="Lesson objectives..."
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="methodology">Methodology</Label>
        <Textarea
          id="methodology"
          value={formData.methodology}
          onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
          placeholder="Teaching methodology..."
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
