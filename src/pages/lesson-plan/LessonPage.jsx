// ====================================================================
// Module: Lesson Plan
// Page: Lessons
//
// Purpose:
// Manage lessons.
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
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'lesson_title', label: 'Lesson Title' },
  { key: 'subject_name', label: 'Subject' },
  { key: 'class_name', label: 'Class' },
  { key: 'topic_count', label: 'Topic Count' },
  { key: 'createdAt', label: 'Created At' },
]

export default function LessonPage() {
  const { toast } = useToast()
  const { data: lessons, isLoading, refetch } = useAsyncData(() => lessonService.getLessons(), [])
  const { data: subjects, isLoading: subjectsLoading } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes, isLoading: classesLoading } = useAsyncData(() => academicsService.classes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = lessons || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const subject = allSubjects.find(s => s._id === r.subject_id)
    const cls = allClasses.find(c => c._id === r.class_id)
    return !q || 
      (r.lesson_title || '').toLowerCase().includes(q) ||
      (subject?.subject_name || '').toLowerCase().includes(q) ||
      (cls?.class_name || '').toLowerCase().includes(q)
  }), [rows, search, allSubjects, allClasses])

  const stats = useMemo(() => ({
    total: rows.length,
    totalTopics: rows.reduce((sum, r) => sum + (r.topic_count || 0), 0),
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'lesson_title',
      header: 'Lesson',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.lesson_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.topic_count || 0} topics</span>
          </div>
        </button>
      ),
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
    { accessorKey: 'topic_count', header: 'Topics', cell: ({ row }) => `${row.original.topic_count || 0}` },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allSubjects, allClasses])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await lessonService.updateLesson(id, payload)
        toast({ title: 'Lesson updated successfully' })
        setEditRow(null)
      } else {
        await lessonService.createLesson(payload)
        toast({ title: 'Lesson created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save lesson:', error)
      toast({ title: 'Failed to save lesson', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await lessonService.deleteLesson(id)
      toast({ title: 'Lesson deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete lesson:', error)
      toast({ title: 'Failed to delete lesson', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Lesson Plan' }, { label: 'Lessons' }]} />
      <PageHeader
        title="Lessons"
        description="Manage lessons."
        icon={BookOpen}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Lesson</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Lessons" value={stats.total} icon={BookOpen} accent="primary" />
        <StatCard label="Total Topics" value={stats.totalTopics} icon={BookOpen} accent="success" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by lesson, subject, or class…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              subject_name: allSubjects.find(s => s._id === r.subject_id)?.subject_name || 'Unknown',
              class_name: allClasses.find(c => c._id === r.class_id)?.class_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="lessons" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No lessons found" description="Add a lesson to get started." actionLabel="Add Lesson" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update lesson details' : 'Add a new lesson'}</DialogDescription>
          </DialogHeader>
          <LessonForm 
            initial={editRow} 
            subjects={allSubjects}
            classes={allClasses}
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
        title="Lesson Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const subject = allSubjects.find(s => s._id === viewRow.subject_id)
          const cls = allClasses.find(c => c._id === viewRow.class_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Lesson Title', value: viewRow.lesson_title || 'Unnamed' },
                { label: 'Subject', value: subject?.subject_name || 'Unknown' },
                { label: 'Class', value: cls?.class_name || 'Unknown' },
                { label: 'Topic Count', value: viewRow.topic_count || 0 },
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
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogDescription>Are you sure you want to delete this lesson? This action cannot be undone.</DialogDescription>
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

function LessonForm({ initial, subjects, classes, subjectsLoading, classesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    subject_id: '',
    class_id: '',
    lesson_title: '',
    topic_count: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        subject_id: initial.subject_id || '',
        class_id: initial.class_id || '',
        lesson_title: initial.lesson_title || '',
        topic_count: initial.topic_count || '',
      })
    } else {
      setFormData({
        subject_id: subjects[0]?._id || '',
        class_id: classes[0]?._id || '',
        lesson_title: '',
        topic_count: '',
      })
    }
  }, [initial, subjects, classes])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      topic_count: Number(formData.topic_count) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="lesson_title">Lesson Title *</Label>
        <Input
          id="lesson_title"
          value={formData.lesson_title}
          onChange={(e) => setFormData({ ...formData, lesson_title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="topic_count">Topic Count</Label>
        <Input
          id="topic_count"
          type="number"
          min="0"
          value={formData.topic_count}
          onChange={(e) => setFormData({ ...formData, topic_count: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
