// ====================================================================
// Module: Examinations
// Page: Exam Results
//
// Data Source: examinationService (GET/POST/PUT/DELETE /exam/result)
// Backend Population: student_id, exam_group_id, subject_id
// ====================================================================
import { useMemo, useState } from 'react'
import { Award, Percent, Trophy, BookOpen, Eye, Pencil, Trash2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DeleteDialog from '@/components/DeleteDialog'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { StatCard } from '@/components/StatCard'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer } from '@/components/Drawer'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useExamResults } from '@/hooks/useExaminations'
import { examinationService } from '@/services/examination.service'
import { academicsService } from '@/services/academics.service'
import { useToast } from '@/hooks/use-toast'

const getId = (val) => {
  if (!val) return ''
  if (typeof val === 'object') return val._id || val.id || ''
  return String(val)
}

const calcPct = (obtained, total) => {
  const numObtained = Number(obtained) || 0
  const numTotal = Number(total) || 0
  if (numTotal <= 0) return '0.00'
  return ((numObtained / numTotal) * 100).toFixed(2)
}

export function ExamResultsPage() {
  const { toast } = useToast()
  const [viewRow, setViewRow] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  // Form State for Add / Edit operations
  const [formData, setFormData] = useState({
    exam_group_id: '',
    student_id: '',
    subject_id: '',
    marks_obtained: '',
    total_marks: '100',
  })

  // Hook from @/hooks/useExaminations
  const {
    rows,
    allResults,
    stats,
    isLoading,
    search,
    setSearch,
    saveResult,
    deleteResult,
    refetch,
  } = useExamResults()

  // Fetch backend datasets (Exam Groups, Subjects, Classes) for dropdowns
  const { data: rawGroups } = useAsyncData(() => examinationService.getExamGroups(), [])
  const { data: rawSubjects } = useAsyncData(() => academicsService.subjects(), [])
  const { data: rawClasses } = useAsyncData(() => academicsService.classes(), [])

  const groups = useMemo(() => (Array.isArray(rawGroups?.data) ? rawGroups.data : Array.isArray(rawGroups) ? rawGroups : []), [rawGroups])
  const subjects = useMemo(() => (Array.isArray(rawSubjects?.data) ? rawSubjects.data : Array.isArray(rawSubjects) ? rawSubjects : []), [rawSubjects])
  const classes = useMemo(() => (Array.isArray(rawClasses?.data) ? rawClasses.data : Array.isArray(rawClasses) ? rawClasses : []), [rawClasses])

  // ID -> Object / Display Name Maps
  const groupMap = useMemo(() => Object.fromEntries(groups.map((x) => [getId(x), x.exam_name || x.name || 'N/A'])), [groups])
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((x) => [getId(x), x.subject_name || x.name || 'N/A'])), [subjects])
  const classMap = useMemo(() => Object.fromEntries(classes.map((x) => [getId(x), x.class_name || x.name || 'N/A'])), [classes])

  // Table Columns
  const columns = useMemo(() => [
    {
      accessorKey: 'student_id',
      header: 'Student',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.student_id ? String(row.original.student_id) : 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'class',
      header: 'Class/Section',
      cell: () => 'N/A',
    },
    {
      accessorKey: 'exam_group_id',
      header: 'Exam Group',
      cell: ({ row }) => groupMap[getId(row.original.exam_group_id)] || 'N/A',
    },
    {
      accessorKey: 'subject_id',
      header: 'Subject',
      cell: ({ row }) => subjectMap[getId(row.original.subject_id)] || 'N/A',
    },
    {
      accessorKey: 'marks',
      header: 'Marks',
      cell: ({ row }) => `${row.original.marks_obtained ?? 0} / ${row.original.total_marks ?? 0}`,
    },
    {
      accessorKey: 'percentage',
      header: 'Percentage',
      cell: ({ row }) => {
        const pct = calcPct(row.original.marks_obtained, row.original.total_marks)
        return <Badge variant={Number(pct) >= 40 ? 'default' : 'destructive'}>{pct}%</Badge>
      },
    },
    {
      id: 'actions',
      header: '',
      size: 48,
      enableSorting: false,
      cell: ({ row }) => (
        <ActionDropdown
          actions={[
            { label: 'View', icon: Eye, onClick: () => setViewRow(row.original) },
            {
              label: 'Edit',
              icon: Pencil,
              onClick: () => {
                const item = row.original
                setEditRow(item)
                setFormData({
                  exam_group_id: getId(item.exam_group_id),
                  student_id: getId(item.student_id),
                  subject_id: getId(item.subject_id),
                  marks_obtained: item.marks_obtained ?? '',
                  total_marks: item.total_marks ?? '100',
                })
              },
            },
            { label: 'Delete', icon: Trash2, onClick: () => setDeleteRow(row.original), destructive: true },
          ]}
        />
      ),
    },
  ], [groupMap, subjectMap])

  // View Drawer Content
  const viewDetails = viewRow ? [
    { label: 'Student ID', value: viewRow.student_id ? String(viewRow.student_id) : 'N/A' },
    { label: 'Exam Group', value: groupMap[getId(viewRow.exam_group_id)] || 'N/A' },
    { label: 'Subject', value: subjectMap[getId(viewRow.subject_id)] || 'N/A' },
    { label: 'Marks', value: `${viewRow.marks_obtained ?? 0} / ${viewRow.total_marks ?? 0}` },
    { label: 'Percentage', value: `${calcPct(viewRow.marks_obtained, viewRow.total_marks)}%` },
  ] : []

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations', to: '/examinations/exam-groups' }, { label: 'Exam Results' }]} />

      <PageHeader
        title="Exam Results"
        description="Manage student examination scores and performance metrics."
        icon={Award}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={isLoading} onClick={refetch}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditRow(null)
                setFormData({
                  exam_group_id: '',
                  student_id: '',
                  subject_id: '',
                  marks_obtained: '',
                  total_marks: '100',
                })
                setAddOpen(true)
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Result
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Results" value={stats.total} icon={Award} accent="primary" />
        <StatCard label="Avg Percentage" value={`${stats.avgPct}%`} icon={Percent} accent="chart2" />
        <StatCard label="Highest Marks" value={stats.maxMarks} icon={Trophy} accent="warning" />
        <StatCard label="Total Subjects" value={stats.totalSubjects} icon={BookOpen} accent="success" />
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search student ID, subject..." className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={7} />
      ) : rows.length === 0 ? (
        <NoData icon={Award} title="No Results Found" description="No examination scores recorded yet. Add one to get started." actionLabel="Add First Result" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={rows} emptyMessage="No matching exam results found." />
      )}

      {/* View Details Drawer */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title="Exam Result Details"
        description="Detailed view of student examination record"
        width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}
      >
        <div className="space-y-4">
          {viewDetails.map((item, idx) => (
            <div key={idx} className="border-b pb-2 last:border-b-0">
              <span className="text-xs font-medium text-muted-foreground block">{item.label}</span>
              <span className="text-sm font-semibold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Add / Edit Result Form Drawer */}
      <Drawer
        open={addOpen || !!editRow}
        onOpenChange={(o) => {
          if (!o) {
            setAddOpen(false)
            setEditRow(null)
          }
        }}
        title={editRow ? 'Edit Exam Result' : 'Add Exam Result'}
        description={editRow ? 'Update examination score details' : 'Add new examination score record'}
        width="sm:max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false)
                setEditRow(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                saveResult(
                  {
                    exam_group_id: formData.exam_group_id,
                    student_id: formData.student_id,
                    subject_id: formData.subject_id,
                    marks_obtained: Number(formData.marks_obtained),
                    total_marks: Number(formData.total_marks),
                  },
                  editRow?._id
                )
                setAddOpen(false)
                setEditRow(null)
              }}
            >
              {editRow ? 'Update' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Student ID</Label>
            <Input
              placeholder="Enter student ID"
              value={formData.student_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  student_id: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label>Exam Group</Label>
            <select
              value={formData.exam_group_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  exam_group_id: e.target.value,
                }))
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select exam group</option>
              {groups.map((g) => (
                <option key={getId(g)} value={getId(g)}>
                  {g.exam_name || g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Subject</Label>
            <select
              value={formData.subject_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  subject_id: e.target.value,
                }))
              }
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={getId(s)} value={getId(s)}>
                  {s.subject_name || s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Marks Obtained</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.marks_obtained}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    marks_obtained: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Total Marks</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.total_marks}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    total_marks: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Delete Exam Result"
        description="Are you sure you want to delete this exam result? This action cannot be undone."
        onConfirm={() => {
          deleteResult(deleteRow._id)
          setDeleteRow(null)
        }}
      />
    </div>
  )
}

export default ExamResultsPage;
