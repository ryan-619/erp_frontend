// ====================================================================
// Module: Examinations
// Page: Exam Schedule
//
// Purpose:
// Weekly examination schedule across classes and sections.
//
// Data Source:
// examination.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================
import { useMemo, useState } from 'react'
import { CalendarRange, Eye, Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import DeleteDialog from '@/components/DeleteDialog'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { ActionDropdown } from '@/components/ActionDropdown'
import { DataTable } from '@/components/DataTable'
import { Drawer, DrawerFooter } from '@/components/Drawer'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { useAsyncData } from '@/hooks/useAsyncData'
import { examinationService } from '@/services/examination.service'
import { academicsService } from '@/services/academics.service'
import { useToast } from '@/hooks/use-toast'

const getId = (val) => (typeof val === 'object' && val !== null ? val._id : val || '')

// Helper to format ISO dates (e.g., 2024-09-15T00:00:00.000Z -> 15 Sep 2024)
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ExamSchedulePage() {
  const { toast } = useToast()

  const { data: schedules, isLoading, refetch } = useAsyncData(() => examinationService.getExamSchedules(), [])
  const { data: groups } = useAsyncData(() => examinationService.getExamGroups(), [])
  const { data: subjects } = useAsyncData(() => academicsService.subjects(), [])
  const { data: classes } = useAsyncData(() => academicsService.classes(), [])

  const groupMap = useMemo(() => Object.fromEntries((groups || []).map((x) => [x._id, x.exam_name || x.name])), [groups])
  const subjectMap = useMemo(() => Object.fromEntries((subjects || []).map((x) => [x._id, x.subject_name || x.name])), [subjects])
  const classMap = useMemo(() => Object.fromEntries((classes || []).map((x) => [x._id, x.class_name || x.name])), [classes])

  const [search, setSearch] = useState('')
  const [viewRow, setViewRow] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  const rows = schedules || []

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const term = search.toLowerCase()
    return rows.filter((r) => {
      const gName = (groupMap[getId(r.exam_group_id)] || '').toLowerCase()
      const sName = (subjectMap[getId(r.subject_id)] || '').toLowerCase()
      const cName = (classMap[getId(r.class_id)] || '').toLowerCase()
      const formattedDate = formatDate(r.date).toLowerCase()
      return [gName, sName, cName, r.room, formattedDate].some((val) => val?.toLowerCase().includes(term))
    })
  }, [rows, search, groupMap, subjectMap, classMap])

  const columns = useMemo(() => [
    {
      id: 'actions',
      header: 'Actions',
      size: 56,
      enableSorting: false,
      cell: ({ row }) => (
        <ActionDropdown
          actions={[
            { label: 'View', icon: Eye, onClick: () => setViewRow(row.original) },
            { label: 'Edit', icon: Pencil, onClick: () => setEditRow(row.original) },
            { label: 'Delete', icon: Trash2, onClick: () => setDeleteRow(row.original), destructive: true },
          ]}
        />
      ),
    },
    { accessorKey: 'exam_group_id', header: 'Exam Group', cell: ({ row }) => groupMap[getId(row.original.exam_group_id)] || 'N/A' },
    { accessorKey: 'subject_id', header: 'Subject', cell: ({ row }) => subjectMap[getId(row.original.subject_id)] || 'N/A' },
    { accessorKey: 'class_id', header: 'Class', cell: ({ row }) => classMap[getId(row.original.class_id)] || 'N/A' },
    { accessorKey: 'date', header: 'Exam Date', cell: ({ row }) => formatDate(row.original.date) },
    { accessorKey: 'start_time', header: 'Start', cell: ({ row }) => row.original.start_time || 'N/A' },
    { accessorKey: 'end_time', header: 'End', cell: ({ row }) => row.original.end_time || 'N/A' },
    { accessorKey: 'room', header: 'Room', cell: ({ row }) => row.original.room || 'N/A' },
  ], [groupMap, subjectMap, classMap])

  const handleSaveSchedule = async (payload, id = null) => {
    try {
      if (id) {
        await examinationService.updateExamSchedule(id, payload)
        toast({ title: 'Schedule updated successfully' })
        setEditRow(null)
      } else {
        await examinationService.createExamSchedule(payload)
        toast({ title: 'Schedule created successfully' })
        setAddOpen(false)
      }
      refetch()
    } catch {
      toast({ title: `Failed to ${id ? 'update' : 'create'} schedule`, variant: 'destructive' })
    }
  }

  const viewDetails = viewRow ? [
    { label: 'Exam Group', value: groupMap[getId(viewRow.exam_group_id)] },
    { label: 'Subject', value: subjectMap[getId(viewRow.subject_id)] },
    { label: 'Class', value: classMap[getId(viewRow.class_id)] },
    { label: 'Exam Date', value: formatDate(viewRow.date) },
    { label: 'Timing', value: `${viewRow.start_time || 'N/A'} – ${viewRow.end_time || 'N/A'}` },
    { label: 'Room', value: viewRow.room },
  ] : []

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Examinations', to: '/examinations/exam-groups' }, { label: 'Exam Schedule' }]} />

      <PageHeader
        title="Exam Schedule"
        description="Weekly examination schedule across classes and sections."
        icon={CalendarRange}
        actions={<Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Schedule</Button>}
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search schedule..." className="max-w-sm" />

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} cols={8} />
      ) : filtered.length === 0 ? (
        <NoData icon={CalendarRange} title="No Exam Schedules Found" description="There are no schedule entries matching your criteria." actionLabel="Add Schedule" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} />
      )}

      {/* View Details Drawer */}
      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Schedule Details" description="View exam schedule details" width="sm:max-w-md" footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {viewDetails.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="text-sm font-medium text-foreground">{item.value || 'N/A'}</dd>
            </div>
          ))}
        </dl>
      </Drawer>

      {/* Add / Edit Form Drawer */}
      <ScheduleFormDrawer
        key={editRow ? editRow._id : addOpen ? 'add-schedule' : 'closed'}
        open={addOpen || !!editRow}
        onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditRow(null) } }}
        groups={groups || []}
        subjects={subjects || []}
        classes={classes || []}
        initialData={editRow}
        onSubmit={(payload) => handleSaveSchedule(payload, editRow?._id)}
      />

      {/* Reusable Delete Dialog */}
      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={subjectMap[getId(deleteRow?.subject_id)] || 'Exam Schedule'}
        onConfirm={async () => {
          try {
            await examinationService.deleteExamSchedule(deleteRow._id)
            toast({ title: 'Schedule deleted' })
            setDeleteRow(null)
            refetch()
          } catch {
            toast({ title: 'Failed to delete schedule', variant: 'destructive' })
          }
        }}
      />
    </div>
  )
}

function ScheduleFormDrawer({ open, onOpenChange, groups, subjects, classes, initialData, onSubmit }) {
  const { toast } = useToast()

  // Format YYYY-MM-DD for standard HTML <input type="date" />
  const formatInputDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : dateStr
  }

  const [form, setForm] = useState({
    exam_group_id: getId(initialData?.exam_group_id) || '',
    subject_id: getId(initialData?.subject_id) || '',
    class_id: getId(initialData?.class_id) || '',
    date: formatInputDate(initialData?.date),
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    room: initialData?.room || '',
  })

  const handleChange = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (!form.exam_group_id || !form.subject_id || !form.class_id || !form.date || !form.start_time || !form.end_time) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields.', variant: 'destructive' })
      return
    }
    onSubmit(form)
  }

  const selectFields = [
    { key: 'exam_group_id', label: 'Exam Group *', options: groups, nameAttr: 'exam_name' },
    { key: 'subject_id', label: 'Subject *', options: subjects, nameAttr: 'subject_name' },
    { key: 'class_id', label: 'Class *', options: classes, nameAttr: 'class_name' },
  ]

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? 'Edit Schedule' : 'Add Schedule'}
      description={initialData ? 'Update existing exam schedule details' : 'Create a new exam schedule entry'}
      width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initialData ? 'Update Schedule' : 'Create Schedule'} onSubmit={handleSubmit} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {selectFields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label className="text-xs">{f.label}</Label>
            <select
              value={form[f.key]}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Select {f.label.replace(' *', '')}</option>
              {f.options.map((item) => (
                <option key={item._id} value={item._id}>{item[f.nameAttr] || item.name}</option>
              ))}
            </select>
          </div>
        ))}

        <div className="space-y-1.5">
          <Label className="text-xs">Exam Date *</Label>
          <Input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Start Time *</Label>
            <Input type="time" value={form.start_time} onChange={(e) => handleChange('start_time', e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End Time *</Label>
            <Input type="time" value={form.end_time} onChange={(e) => handleChange('end_time', e.target.value)} required />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Room / Hall</Label>
          <Input type="text" value={form.room} onChange={(e) => handleChange('room', e.target.value)} placeholder="e.g. Hall A" />
        </div>
      </form>
    </Drawer>
  )
}