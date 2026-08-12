// ====================================================================
// Module: Online Exam
// Page: Question Bank
//
// Purpose:
// Manage the question bank.
//
// Data Source:
// onlineExam.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState } from 'react'
import { Circle as HelpCircle, Plus, Eye, Pencil, Trash2 } from 'lucide-react'
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
import { onlineExamService } from '@/services/onlineExam.service'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'question', label: 'Question' },
  { key: 'marks', label: 'Marks' },
  { key: 'correct_answer', label: 'Correct Answer' },
  { key: 'createdAt', label: 'Created At' },
]

export default function QuestionBankPage() {
  const { toast } = useToast()
  const { data: questions, isLoading, refetch } = useAsyncData(() => onlineExamService.getQuestions(), [])
  const { data: exams, isLoading: examsLoading } = useAsyncData(() => onlineExamService.getExams(), [])
  
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = questions || []
  const allExams = exams || []

  const filtered = useMemo(() => rows.filter((r) => {
    const q = search.toLowerCase()
    const exam = allExams.find(e => e._id === r.exam_id)
    return !q || 
      (r.question || '').toLowerCase().includes(q) ||
      (r.correct_answer || '').toLowerCase().includes(q) ||
      (exam?.exam_name || '').toLowerCase().includes(q)
  }), [rows, search, allExams])

  const stats = useMemo(() => ({
    total: rows.length,
  }), [rows])

  const columns = useMemo(() => [
    {
      accessorKey: 'question',
      header: 'Question',
      cell: ({ row }) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="h-4 w-4" />
          </div>
          <span className="font-medium hover:underline line-clamp-1 max-w-xs">{row.original.question || 'No question'}</span>
        </button>
      ),
    },
    { accessorKey: 'marks', header: 'Marks', cell: ({ row }) => row.original.marks || 0 },
    { accessorKey: 'correct_answer', header: 'Answer', cell: ({ row }) => <Badge variant="outline">{row.original.correct_answer?.toUpperCase() || '—'}</Badge> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  ], [])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  const handleSave = async (payload, id) => {
    try {
      if (id) {
        await onlineExamService.updateQuestion(id, payload)
        toast({ title: 'Question updated successfully' })
        setEditRow(null)
      } else {
        await onlineExamService.createQuestion(payload)
        toast({ title: 'Question created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch (error) {
      console.error('Failed to save question:', error)
      toast({ title: 'Failed to save question', variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await onlineExamService.deleteQuestion(id)
      toast({ title: 'Question deleted successfully' })
      setDeleteRow(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete question:', error)
      toast({ title: 'Failed to delete question', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Online Exam' }, { label: 'Question Bank' }]} />
      <PageHeader
        title="Question Bank"
        description="Manage exam questions."
        icon={HelpCircle}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Question</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-1">
        <StatCard label="Total Questions" value={stats.total} icon={HelpCircle} accent="primary" />
      </div>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by question, answer, or exam…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons rows={filtered} columns={EXPORT_COLS} filename="question-bank" />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No questions found" description="Add a question to get started." actionLabel="Add Question" onAction={() => setAddOpen(true)} />
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
            <DialogTitle>{editRow ? 'Edit Question' : 'Add Question'}</DialogTitle>
            <DialogDescription>{editRow ? 'Update question details' : 'Add a new question'}</DialogDescription>
          </DialogHeader>
          <QuestionForm initial={editRow} exams={allExams} examsLoading={examsLoading} onSubmit={(payload) => handleSave(payload, editRow?._id)} onCancel={() => { setAddOpen(false); setEditRow(null) }} />
        </DialogContent>
      </Dialog>

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Question Details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow && (() => {
          const exam = allExams.find(e => e._id === viewRow.exam_id)
          return (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                { label: 'Question', value: viewRow.question || '—' },
                { label: 'Option A', value: viewRow.option_a || '—' },
                { label: 'Option B', value: viewRow.option_b || '—' },
                { label: 'Option C', value: viewRow.option_c || '—' },
                { label: 'Option D', value: viewRow.option_d || '—' },
                { label: 'Correct Answer', value: viewRow.correct_answer?.toUpperCase() || '—' },
                { label: 'Marks', value: viewRow.marks || 0 },
                { label: 'Exam', value: exam?.exam_name || 'Unknown' },
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
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>Are you sure you want to delete this question? This action cannot be undone.</DialogDescription>
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

function QuestionForm({ initial, exams, examsLoading, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    exam_id: '', question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', marks: '',
  })

  useState(() => {
    if (initial) {
      setFormData({
        exam_id: initial.exam_id || '', question: initial.question || '', option_a: initial.option_a || '', option_b: initial.option_b || '', option_c: initial.option_c || '', option_d: initial.option_d || '', correct_answer: initial.correct_answer || '', marks: initial.marks || '',
      })
    } else {
      setFormData({
        exam_id: exams.length > 0 ? exams[0]._id : '', question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', marks: '',
      })
    }
  }, [initial, exams])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, marks: Number(formData.marks) || 0 })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="exam_id">Exam *</Label>
        <select id="exam_id" value={formData.exam_id} onChange={(e) => setFormData({ ...formData, exam_id: e.target.value })} disabled={examsLoading} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select exam</option>
          {exams.map((e) => (
            <option key={e._id} value={e._id}>{e.exam_name || 'Unnamed'}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="question">Question *</Label>
        <Textarea id="question" value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} placeholder="Enter question..." rows={3} required />
      </div>
      <div>
        <Label htmlFor="option_a">Option A *</Label>
        <Input id="option_a" value={formData.option_a} onChange={(e) => setFormData({ ...formData, option_a: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="option_b">Option B *</Label>
        <Input id="option_b" value={formData.option_b} onChange={(e) => setFormData({ ...formData, option_b: e.target.value })} required />
      </div>
      <div>
        <Label htmlFor="option_c">Option C</Label>
        <Input id="option_c" value={formData.option_c} onChange={(e) => setFormData({ ...formData, option_c: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="option_d">Option D</Label>
        <Input id="option_d" value={formData.option_d} onChange={(e) => setFormData({ ...formData, option_d: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="correct_answer">Correct Answer *</Label>
        <select id="correct_answer" value={formData.correct_answer} onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" required>
          <option value="">Select correct answer</option>
          <option value="a">Option A</option>
          <option value="b">Option B</option>
          <option value="c">Option C</option>
          <option value="d">Option D</option>
        </select>
      </div>
      <div>
        <Label htmlFor="marks">Marks *</Label>
        <Input id="marks" type="number" min="0" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: e.target.value })} required />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </DialogFooter>
    </form>
  )
}
