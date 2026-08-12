// ====================================================================
// Module: Homework
// Page: Homework
//
// Purpose:
// Manage homework assignments.
//
// Data Source:
// homework.service.js
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
import { homeworkService } from '@/services/homework.service'
import { academicsService } from '@/services/academics.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'class_name', label: 'Class' },
  { key: 'subject_name', label: 'Subject' },
  { key: 'homework_date', label: 'Homework Date' },
  { key: 'submission_date', label: 'Submission Date' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created At' },
]

export default function AddHomeworkPage() {
  const { toast } = useToast()
  const { data: homeworks, isLoading, refetch } = useAsyncData(() => homeworkService.getHomeworks(), [])
  const { data: subjects, isLoading: subjectsLoading } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes, isLoading: classesLoading } = useAsyncData(() => academicsService.classes(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = homeworks || []
  const allSubjects = subjects || []
  const allClasses = classes || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const subject = allSubjects.find(s => s._id === r.subject_id)
    const cls = allClasses.find(c => c._id === r.class_id)
    return !q || 
      (subject?.subject_name || '').toLowerCase().includes(q) ||
      (cls?.class_name || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
  }), [rows, search, allSubjects, allClasses])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'description',
      header: 'Homework',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline line-clamp-1 max-w-xs">{row.original.description || 'No description'}</span>
            <span className="text-xs text-muted-foreground">{row.original.submission_date ? formatDate(row.original.submission_date) : 'No submission date'}</span>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'class_id',
      header: 'Class',
      cell: ({ row }) => {
        const cls = allClasses.find(c => c._id === row.original.class_id)
        return <Badge variant="secondary">{cls?.class_name || 'Unknown'}</Badge>
      },
    },
    {
      accessorKey: 'subject_id',
      header: 'Subject',
      cell: ({ row }) => {
        const subject = allSubjects.find(s => s._id === row.original.subject_id)
        return <Badge variant="outline">{subject?.subject_name || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'homework_date', header: 'Homework Date', cell: ({ row }) => row.original.homework_date ? formatDate(row.original.homework_date) : '—' },
    { accessorKey: 'submission_date', header: 'Submission Date', cell: ({ row }) => row.original.submission_date ? formatDate(row.original.submission_date) : '—' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allClasses, allSubjects])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await homeworkService.updateHomework(id, payload)
        toast({ title: 'Homework updated successfully' })
        setEditRow(null)
      } else {
        await homeworkService.createHomework(payload)
        toast({ title: 'Homework created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save homework:', error)
      toast({ title: 'Failed to save homework', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await homeworkService.deleteHomework(id)
      toast({ title: 'Homework deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete homework:', error)
      toast({ title: 'Failed to delete homework', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Homework' }, { label: 'Homework' }]} />
      <PageHeader
        title="Homework"
        description="Manage homework assignments."
        icon={BookOpen}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Homework</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Homework" value={stats.total} icon={BookOpen} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by subject, class, or description…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              subject_name: allSubjects.find(s => s._id === r.subject_id)?.subject_name || 'Unknown',
              class_name: allClasses.find(c => c._id === r.class_id)?.class_name || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="homework" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={6} />
      ) : filtered.length === 0 ? (
        <NoData title="No homework found" description="Add homework to get started." actionLabel="Add Homework" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Homework' : 'Add Homework'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update homework details' : 'Add a new homework assignment'}</DialogDescription>
          </DialogHeader>
          <HomeworkForm initial={editRow} subjects={allSubjects} classes={allClasses} subjectsLoading={subjectsLoading} classesLoading={classesLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Homework Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const subject = allSubjects.find(s => s._id === viewRow.subject_id)
          const cls = allClasses.find(c => c._id === viewRow.class_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Description', value: viewRow.description || '—' },
                { label: 'Subject', value: subject?.subject_name || 'Unknown' },
                { label: 'Class', value: cls?.class_name || 'Unknown' },
                { label: 'Homework Date', value: viewRow.homework_date ? formatDate(viewRow.homework_date) : '—' },
                { label: 'Submission Date', value: viewRow.submission_date ? formatDate(viewRow.submission_date) : '—' },
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
            <DialogTitle>Delete Homework</DialogTitle>
            <DialogDescription>Are you sure you want to delete this homework? This action cannot be undone.</DialogDescription>
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

function HomeworkForm({ initial, subjects, classes, subjectsLoading, classesLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    class_id: '', subject_id: '', homework_date: '', submission_date: '', description: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        class_id: initial.class_id || '', subject_id: initial.subject_id || '', homework_date: initial.homework_date ? initial.homework_date.split('T')[0] : '', submission_date: initial.submission_date ? initial.submission_date.split('T')[0] : '', description: initial.description || '',
      })
    } else {
      setFormData({
        class_id: classes.length > 0 ? classes[0]._id : '', subject_id: subjects.length > 0 ? subjects[0]._id : '', homework_date: '', submission_date: '', description: '',
      })
    }
  }, [initial, subjects, classes])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="subject_id">Subject *</Label>
        <select id="subject_id" value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })} disabled={subjectsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>{s.subject_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="homework_date">Homework Date</Label>
        <Input id="homework_date" type="date" value={formData.homework_date} onChange={(e) => setFormData({ ...formData, homework_date: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="submission_date">Submission Date</Label>
        <Input id="submission_date" type="date" value={formData.submission_date} onChange={(e) => setFormData({ ...formData, submission_date: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Homework description..." rows={3} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
