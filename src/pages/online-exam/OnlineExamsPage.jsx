// ====================================================================
// Module: Online Exam
// Page: Online Exams
//
// Purpose:
// Manage online exams.
//
// Data Source:
// onlineExam.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { MonitorPlay, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { onlineExamService } from '@/services/onlineExam.service'
import { academicsService } from '@/services/academics.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'exam_name', label: 'Exam Name' },
  { key: 'class_name', label: 'Class' },
  { key: 'subject_name', label: 'Subject' },
  { key: 'duration', label: 'Duration (min)' },
  { key: 'total_marks', label: 'Total Marks' },
  { key: 'scheduled_at', label: 'Scheduled At' },
]

export default function OnlineExamsPage() {
  const { toast } = useToast()
  const { data: exams, isLoading, refetch } = useAsyncData(() => onlineExamService.getExams(), [])
  const { data: subjects, isLoading: subjectsLoading } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes, isLoading: classesLoading } = useAsyncData(() => academicsService.classes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = exams || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const subject = allSubjects.find(s => s._id === r.subject_id)
    const cls = allClasses.find(c => c._id === r.class_id)
    return !q || 
      (r.exam_name || '').toLowerCase().includes(q) ||
      (subject?.subject_name || '').toLowerCase().includes(q) ||
      (cls?.class_name || '').toLowerCase().includes(q)
  }), [rows, search, allSubjects, allClasses])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'exam_name',
      header: 'Exam',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MonitorPlay className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.exam_name || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.duration || 0} min</span>
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
    { accessorKey: 'total_marks', header: 'Marks', cell: ({ row }) => row.original.total_marks || 0 },
    { accessorKey: 'scheduled_at', header: 'Scheduled', cell: ({ row }) => row.original.scheduled_at ? formatDate(row.original.scheduled_at) : '—' },
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
        await onlineExamService.updateExam(id, payload)
        toast({ title: 'Exam updated successfully' })
        setEditRow(null)
      } else {
        await onlineExamService.createExam(payload)
        toast({ title: 'Exam created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save exam:', error)
      toast({ title: 'Failed to save exam', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await onlineExamService.deleteExam(id)
      toast({ title: 'Exam deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete exam:', error)
      toast({ title: 'Failed to delete exam', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Online Exam' }, { label: 'Online Exams' }]} />
      <PageHeader
        title="Online Exams"
        description="Manage online examinations."
        icon={MonitorPlay}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Exam</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Exams" value={stats.total} icon={MonitorPlay} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by exam, subject, or class…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              subject_name: allSubjects.find(s => s._id === r.subject_id)?.subject_name || 'Unknown',
              class_name: allClasses.find(c => c._id === r.class_id)?.class_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="online-exams" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No exams found" description="Add an exam to get started." actionLabel="Add Exam" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Exam' : 'Add Exam'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update exam details' : 'Add a new online exam'}</DialogDescription>
          </DialogHeader>
          <ExamForm initial={editRow} subjects={allSubjects} classes={allClasses} subjectsLoading={subjectsLoading} classesLoading={classesLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Exam Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const subject = allSubjects.find(s => s._id === viewRow.subject_id)
          const cls = allClasses.find(c => c._id === viewRow.class_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Exam Name', value: viewRow.exam_name || 'Unnamed' },
                { label: 'Subject', value: subject?.subject_name || 'Unknown' },
                { label: 'Class', value: cls?.class_name || 'Unknown' },
                { label: 'Duration', value: `${viewRow.duration || 0} min` },
                { label: 'Total Marks', value: viewRow.total_marks || 0 },
                { label: 'Scheduled', value: viewRow.scheduled_at ? formatDate(viewRow.scheduled_at) : '—' },
                { label: 'Created', value: formatDate(viewRow.createdAt) },
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
            <DialogTitle>Delete Exam</DialogTitle>
            <DialogDescription>Are you sure you want to delete this exam? This action cannot be undone.</DialogDescription>
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

function ExamForm({ initial, subjects, classes, subjectsLoading, classesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    subject_id: '', class_id: '', exam_name: '', duration: '', total_marks: '', scheduled_at: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        subject_id: initial.subject_id || '', class_id: initial.class_id || '', exam_name: initial.exam_name || '', duration: initial.duration || '', total_marks: initial.total_marks || '', scheduled_at: initial.scheduled_at ? initial.scheduled_at.split('T')[0] : '',
      })
    } else {
      setFormData({
        subject_id: subjects.length > 0 ? subjects[0]._id : '', class_id: classes.length > 0 ? classes[0]._id : '', exam_name: '', duration: '', total_marks: '', scheduled_at: '',
      })
    }
  }, [initial, subjects, classes])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, duration: Number(formData.duration) || 0, total_marks: Number(formData.total_marks) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject_id">Subject *</Label>
        <select id="subject_id" value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} disabled={subjectsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.subject_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="class_id">Class *</Label>
        <select id="class_id" value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} disabled={classesLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c._id} value={c._id}>{c.class_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="exam_name">Exam Name *</Label>
        <Input id="exam_name" value={formData.exam_name} onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="duration">Duration (minutes) *</Label>
        <Input id="duration" type="number" min="1" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="total_marks">Total Marks *</Label>
        <Input id="total_marks" type="number" min="0" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="scheduled_at">Scheduled Date</Label>
        <Input id="scheduled_at" type="date" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
