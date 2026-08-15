// ====================================================================
// Module: Academics
// Page: Promote Students
//
// Purpose:
// Promote students to the next class for a new academic session.
//
// Data Source:
// academics.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { Plus, ArrowRight, Pencil, Trash2, Eye, BookOpen, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { usePromotions } from '@/hooks/useAcademics'
import { academicsService } from '@/services/academics.service'
import apiClient from '@/services/api'
import { formatDate } from '@/utils/format'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: "student_name", label: "Student" },
  { key: "from_class", label: "Current Class" },
  { key: "to_class", label: "Promoted Class" },
  { key: "session", label: "Session" },
]

export default function PromoteStudentsPage() {
  const { toast } = useToast()
  const { rows, stats, isLoading, search, setSearch, savePromotion, deletePromotion } = usePromotions()
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [studentOptions, setStudentOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          classRes,
          studentRes,
        ] = await Promise.all([
          academicsService.classes(),
          apiClient.get("/students?page=1&limit=100"),
        ])

        setClassOptions(classRes || [])
        setStudentOptions(studentRes?.data || studentRes || [])
      } catch (err) {
        // Error handling
      }
    }

    loadData()
  }, [])

  // Build lookup maps for efficient ID resolution
  const studentMap = useMemo(() => {
    const map = {}
    studentOptions.forEach(s => map[s._id || s.id] = s)
    return map
  }, [studentOptions])

  const columns = useMemo(() => [
    {
      accessorKey: "student_id",
      header: "Student",
      cell: ({ row }) => {
        const student = studentMap[row.original.student_id]
        const studentName = student?.name?.first && student?.name?.last 
          ? `${student.name.first} ${student.name.last}`
          : student?.first_name && student?.last_name
          ? `${student.first_name} ${student.last_name}`
          : 'Unknown'
        return (
          <button className="flex items-center gap-3 text-left" onClick={() => setViewRow(row.original)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium hover:underline">{studentName}</p>
            </div>
          </button>
        )
      },
    },
    {
      accessorKey: "from_class",
      header: "Current Class",
      cell: ({ row }) => {
        return row.original.from_class || 'Unknown'
      },
    },
    {
      accessorKey: "to_class",
      header: "Promoted Class",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.to_class || 'Unknown'}</span>
        </div>
      ),
    },
    {
      accessorKey: "session",
      header: "Academic Session",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
  ], [studentMap])

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Home', to: '/dashboard' }, { label: 'Academics', to: '/academics/classes' }, { label: 'Promote Students' }]} />
      <PageHeader
        title="Promote Students"
        description="Promote students to the next class for a new academic session."
        icon={ArrowRight}
        actions={
          <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Promote Student</Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Total Promotions"
          value={stats.total}
          icon={ArrowRight}
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
        <SearchBar value={search} onChange={setSearch} placeholder="Search promotions…" className="max-w-sm" />
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons 
            rows={rows.map(r => {
              const student = studentMap[r.student_id]
              const studentName = student?.name?.first && student?.name?.last 
                ? `${student.name.first} ${student.name.last}`
                : student?.first_name && student?.last_name
                ? `${student.first_name} ${student.last_name}`
                : 'Unknown'
              return {
                ...r,
                student_name: studentName,
                from_class: r.from_class || 'Unknown',
                to_class: r.to_class || 'Unknown',
                session: r.session || 'Unknown',
              }
            })} 
            columns={EXPORT_COLS} 
            filename="promotions" 
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <NoData title="No promotions found" actionLabel="Promote Student" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          enableSelection
          enableExport
          exportFilename="promotions"
          bulkActions={[{ label: 'Delete', icon: Trash2, variant: 'destructive', onClick: (ids) => { ids.forEach((id) => deletePromotion(id)) } }]}
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      <PromotionDrawer open={addOpen} onOpenChange={setAddOpen} title="Promote Student" studentOptions={studentOptions} classOptions={classOptions} onSubmit={async (p) => { await savePromotion(p); setAddOpen(false) }} />
      <PromotionDrawer open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)} title="Edit Promotion" initial={editRow} studentOptions={studentOptions} classOptions={classOptions} onSubmit={async (p) => { await savePromotion(p, editRow._id); setEditRow(null) }} />

      <Drawer open={!!viewRow} onOpenChange={(o) => !o && setViewRow(null)} title="Promotion Details" description={(() => {
        const student = studentMap[viewRow?.student_id]
        return student?.name?.first && student?.name?.last 
          ? `${student.name.first} ${student.name.last}`
          : student?.first_name && student?.last_name
          ? `${student.first_name} ${student.last_name}`
          : 'Unknown'
      })()} width="sm:max-w-md"
        footer={<Button variant="outline" onClick={() => setViewRow(null)}>Close</Button>}>
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              { 
                label: "Student", 
                value: (() => {
                  const student = studentMap[viewRow.student_id]
                  return student?.name?.first && student?.name?.last 
                    ? `${student.name.first} ${student.name.last}`
                    : student?.first_name && student?.last_name
                    ? `${student.first_name} ${student.last_name}`
                    : 'Unknown'
                })()
              },
              { label: "Current Class", value: viewRow.from_class || 'Unknown' },
              { label: "Promoted Class", value: viewRow.to_class || 'Unknown' },
              { label: "Session", value: viewRow.session || 'Unknown' },
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

      <DeleteDialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)} entityName={(() => {
        const student = studentMap[deleteRow?.student_id]
        return student?.name?.first && student?.name?.last 
          ? `${student.name.first} ${student.name.last}`
          : student?.first_name && student?.last_name
          ? `${student.first_name} ${student.last_name}`
          : 'Unknown'
      })()}
        onConfirm={() => { deletePromotion(deleteRow._id || deleteRow.id); setDeleteRow(null) }} />
    </div>
  )
}

function PromotionDrawer({ open, onOpenChange, title, initial, studentOptions = [], classOptions = [], onSubmit }) {
  const [form, setForm] = useState({
    student_id: initial?.student_id || '',
    from_class: initial?.from_class || '',
    to_class: initial?.to_class || '',
    session: initial?.session || '',
  })

  useEffect(() => {
    setForm({
      student_id: initial?.student_id || '',
      from_class: initial?.from_class || '',
      to_class: initial?.to_class || '',
      session: initial?.session || '',
    })
  }, [initial])

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={title} description="Promotion details" width="sm:max-w-md"
      footer={<DrawerFooter onCancel={() => onOpenChange(false)} submitLabel={initial ? 'Save' : 'Promote'} onSubmit={() => onSubmit(form)} />}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">Student <span className="text-destructive">*</span></Label>
            <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select student</option>
              {studentOptions.map((s) => {
                const studentName = s.name?.first && s.name?.last 
                  ? `${s.name.first} ${s.name.last}`
                  : s.first_name && s.last_name
                  ? `${s.first_name} ${s.last_name}`
                  : 'Unknown'
                return <option key={s._id || s.id} value={s._id || s.id}>{studentName}</option>
              })}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From Class <span className="text-destructive">*</span></Label>
            <select value={form.from_class} onChange={(e) => setForm((f) => ({ ...f, from_class: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select class</option>
              {classOptions.map((c) => <option key={c._id} value={c.class_name}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To Class <span className="text-destructive">*</span></Label>
            <select value={form.to_class} onChange={(e) => setForm((f) => ({ ...f, to_class: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring" required>
              <option value="">Select class</option>
              {classOptions.map((c) => <option key={c._id} value={c.class_name}>{c.class_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Session <span className="text-destructive">*</span></Label>
            <Input value={form.session} onChange={(e) => setForm((f) => ({ ...f, session: e.target.value }))} placeholder="e.g. 2024-2025" required />
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}