// ====================================================================
// Module: Lesson Plan
// Page: Topics
//
// Purpose:
// Manage topics.
//
// Data Source:
// lesson.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { FileText, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'topic_title', label: 'Topic Title' },
  { key: 'lesson_title', label: 'Lesson' },
  { key: 'duration', label: 'Duration' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created At' },
]

export default function TopicPage() {
  const { toast } = useToast()
  const { data: topics, isLoading, refetch } = useAsyncData(() => lessonService.getTopics(), [])
  const { data: lessons, isLoading: lessonsLoading } = useAsyncData(() => lessonService.getLessons(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = topics || []
  const allLessons = lessons || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const lesson = allLessons.find(l => l._id === r.lesson_id)
    return !q || 
      (r.topic_title || '').toLowerCase().includes(q) ||
      (lesson?.lesson_title || '').toLowerCase().includes(q) ||
      (r.duration || '').toLowerCase().includes(q)
  }), [rows, search, allLessons])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'topic_title',
      header: 'Topic',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium hover:underline">{row.original.topic_title || 'Unnamed'}</span>
            <span className="text-xs text-muted-foreground">{row.original.duration || '—'}</span>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'lesson_id',
      header: 'Lesson',
      cell: ({ row }) => {
        const lesson = allLessons.find(l => l._id === row.original.lesson_id)
        return <Badge variant="secondary">{lesson?.lesson_title || 'Unknown'}</Badge>
      },
    },
    { accessorKey: 'duration', header: 'Duration', cell: ({ row }) => row.original.duration || '—' },
    { accessorKey: 'description', header: 'Description', cell: ({ row }) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{row.original.description || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [allLessons])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await lessonService.updateTopic(id, payload)
        toast({ title: 'Topic updated successfully' })
        setEditRow(null)
      } else {
        await lessonService.createTopic(payload)
        toast({ title: 'Topic created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save topic:', error)
      toast({ title: 'Failed to save topic', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await lessonService.deleteTopic(id)
      toast({ title: 'Topic deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete topic:', error)
      toast({ title: 'Failed to delete topic', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Lesson Plan' }, { label: 'Topics' }]} />
      <PageHeader
        title="Topics"
        description="Manage lesson topics."
        icon={FileText}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Topic</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Topics" value={stats.total} icon={FileText} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by topic, lesson, or duration…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={filtered.map(r => ({
              ...r,
              lesson_title: allLessons.find(l => l._id === r.lesson_id)?.lesson_title || 'Unknown',
            }))} 
            columns={EXPORT_COLS} 
            filename="topics" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={5} />
      ) : filtered.length === 0 ? (
        <NoData title="No topics found" description="Add a topic to get started." actionLabel="Add Topic" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update topic details' : 'Add a new topic'}</DialogDescription>
          </DialogHeader>
          <TopicForm 
            initial={editRow} 
            lessons={allLessons}
            lessonsLoading={lessonsLoading}
            onSubmit={(payload) => handleSave(payload, editRow?._id)} 
            onCancel={() => { setAddOpen(false); setEditRow(null) }} 
          />
        </DialogContent>
      </Dialog>

      {/* View Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Topic Details"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        {viewRow && (() => {
          const lesson = allLessons.find(l => l._id === viewRow.lesson_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Topic Title', value: viewRow.topic_title || 'Unnamed' },
                { label: 'Lesson', value: lesson?.lesson_title || 'Unknown' },
                { label: 'Duration', value: viewRow.duration || '—' },
                { label: 'Description', value: viewRow.description || '—' },
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
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>Are you sure you want to delete this topic? This action cannot be undone.</DialogDescription>
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

function TopicForm({ initial, lessons, lessonsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    lesson_id: '',
    topic_title: '',
    duration: '',
    description: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        lesson_id: initial.lesson_id || '',
        topic_title: initial.topic_title || '',
        duration: initial.duration || '',
        description: initial.description || '',
      })
    } else {
      setFormData({
        lesson_id: lessons[0]?._id || '',
        topic_title: '',
        duration: '',
        description: '',
      })
    }
  }, [initial, lessons])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="lesson_id">Lesson *</Label>
        <select
          id="lesson_id"
          value={formData.lesson_id}
          onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
          disabled={lessonsLoading}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          required
        >
          <option value="">Select lesson</option>
          {lessons.map((l) => (
            <option key={l._id} value={l._id}>{l.lesson_title || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="topic_title">Topic Title *</Label>
        <Input
          id="topic_title"
          value={formData.topic_title}
          onChange={(e) => setFormData({ ...formData, topic_title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="duration">Duration</Label>
        <Input
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="e.g., 45 mins, 1 hour"
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Topic description..."
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
