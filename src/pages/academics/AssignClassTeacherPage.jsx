// ====================================================================
// Module: Academics
// Page: Assign Class Teacher
//
// Purpose:
// Assign teachers to classes and sections.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, UserCog, Pencil, Trash2, Eye, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useClassTeachers } from '@/hooks/useAcademics'
import { academicsService } from '@/services/academics.service'
import apiClient from '@/services/api'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "teacher_name", label: "Teacher" },
  { key: "class_name", label: "Class" },
  { key: "section_name", label: "Section" },
  { key: "createdAt", label: "Created" },
]

export default function AssignClassTeacherPage() {
  const { toast } = useToast()
  const { rows, allClassTeachers, stats, isLoading, search, setSearch, saveClassTeacher, deleteClassTeacher } = useClassTeachers()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])
  const [teacherOptions, setTeacherOptions] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          classRes,
          sectionRes,
          teacherRes,
        ] = await Promise.all([
          academicsService.classes(),
          academicsService.sections(),
          apiClient.get("/hr/staff-directory"),
        ])

        setClassOptions(classRes || [])
        setSectionOptions(sectionRes || [])
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

  const teacherMap = useMemo(() => {
    const map = {}
    teacherOptions.forEach(t => map[t._id] = t)
    return map
  }, [teacherOptions])

  const columns = useMemo(() => [
    {
      accessorKey: "teacher_id",
      header: "Teacher",
      cell: ({ row }) => {
        const teacher = teacherMap[row.original.teacher_id]
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium hover:underline">{teacher?.name || 'Unknown'}</p>
            </div>
          </button>
        )
      },
    },
    {
      accessorKey: "class_id",
      header: "Class",
      cell: ({ row }) => {
        const cls = classMap[row.original.class_id]
        return cls?.class_name || row.original.class_id
      },
    },
    {
      accessorKey: "section_id",
      header: "Section",
      cell: ({ row }) => {
        const section = sectionMap[row.original.section_id]
        return section?.section_name || row.original.section_id
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ], [classMap, sectionMap, teacherMap])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Remove', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Assign Class Teacher' }]} />
      <PageHeader
        title="Assign Class Teacher"
        description="Assign teachers to classes and sections."
        icon={UserCog}
        actions={
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Assign Teacher</Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Assignments"
          value={stats.total}
          icon={UserCog}
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
        <SearchBar value={search} onChange={setSearch} placeholder="Search by teacher or class…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={rows.map(r => ({
              ...r,
              teacher_name: teacherMap[r.teacher_id]?.name || r.teacher_id,
              class_name: classMap[r.class_id]?.class_name || r.class_id,
              section_name: sectionMap[r.section_id]?.section_name || r.section_id,
            }))} 
            columns={EXPORT_COLS} 
            filename="class-teachers" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={5} cols={4} />
      ) : rows.length === 0 ? (
        <NoData title="No assignments found" actionLabel="Assign Teacher" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="class-teachers"
          bulkActions={[{ label: 'Remove', icon: Trash2, variant: 'destructive', onClick: (ids) => { ids.forEach((id) => deleteClassTeacher(id)) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <AssignDrawer open={addOpen} onOpenChange={setAddOpen} title="Assign Class Teacher" classOptions={classOptions} sectionOptions={sectionOptions} teacherOptions={teacherOptions} onSubmit={async (p) => { await saveClassTeacher(p); setAddOpen(false) }} />
      <AssignDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Assignment" initial={editRow} classOptions={classOptions} sectionOptions={sectionOptions} teacherOptions={teacherOptions} onSubmit={async (p) => { await saveClassTeacher(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Assignment Details" description={teacherMap[viewRow?.teacher_id]?.name || 'Unknown'} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { label: "Teacher", value: teacherMap[viewRow.teacher_id]?.name || 'Unknown' },
              { label: "Class", value: classMap[viewRow.class_id]?.class_name || 'Unknown' },
              { label: "Section", value: sectionMap[viewRow.section_id]?.section_name || 'Unknown' },
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

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={deleteRow ? `${teacherMap[deleteRow.teacher_id]?.name || 'Unknown'} — ${classMap[deleteRow.class_id]?.class_name || 'Unknown'} ${sectionMap[deleteRow.section_id]?.section_name || 'Unknown'}` : ''}
        onConfirm={() => { deleteClassTeacher(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function AssignDrawer({ open, onOpenChange, title, initial, classOptions = [], sectionOptions = [], teacherOptions = [], onSubmit }) {
  const [form, setForm] = useState({
    teacher_id: initial?.teacher_id || '',
    class_id: initial?.class_id || '',
    section_id: initial?.section_id || '',
  })

  useEffect(() => {
    setForm({
      teacher_id: initial?.teacher_id || '',
      class_id: initial?.class_id || '',
      section_id: initial?.section_id || '',
    })
  }, [initial])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description="Assignment details" width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save' : 'Assign'} onSubmit={() => onSubmit(form)} />}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={1}>
          <div className="space-y-1.5">
            <Label className="text-xs">Teacher <span className="text-destructive">*</span></Label>
            <select value={form.teacher_id} onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select teacher</option>
              {teacherOptions.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}