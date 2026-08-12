// ====================================================================
// Module: Examinations
// Page: Marks Grade
//
// Purpose:
// Define grade bands, grade points, and percentages.
//
// Data Source:
// examination.service.js
//
// Backend:
// APIs should always be called through the service layer.
// Never call Axios directly from this page.
// ====================================================================

import { useMemo, useState, useEffect } from 'react'
import { ChartBar as BarChart3, Plus, Pencil, Trash2, Eye } from 'lucide-react'
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
import { DeleteDialog } from '@/components/DeleteDialog'
import { ExportButtons } from '@/components/ExportButtons'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { NoData } from '@/components/NoData'
import { FormSection } from '@/components/FormSection'
import { useAsyncData } from '@/hooks/useAsyncData'
import { examinationService } from '@/services/examination.service'
import { useToast } from '@/hooks/use-toast'

const EXPORT_COLS = [
  { key: 'grade_name', label: 'Grade' },
  { key: 'percent_from', label: 'Percentage From' },
  { key: 'percent_to', label: 'Percentage To' },
  { key: 'percent_range', label: 'Percentage Range' },
  { key: 'grade_point', label: 'Grade Point' },
]

export default function MarksGradePage() {
  const { toast } = useToast()
  const { data, isLoading, refetch } = useAsyncData(() => examinationService.getMarksGrades(), [])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRow, setViewRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)

  // 10. Default sorting by grade_point (Descending: 10, 9, 8...)
  const rows = useMemo(() => {
    const list = data || []
    return [...list].sort((a, b) => (b.grade_point ?? 0) - (a.grade_point ?? 0))
  }, [data])

  // 8. Search filtering
  const filtered = useMemo(
    () => rows.filter((r) => !search || r.grade_name?.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  )

  // 1. Stats Cards Logic
  const stats = useMemo(() => {
    if (!rows.length) return { total: 0, highestPoint: 0, rangeStr: '-', passingGrade: '-' }
    const highestPoint = Math.max(...rows.map((r) => r.grade_point || 0))
    const highestPercent = Math.max(...rows.map((r) => r.percent_to || 0))
    const lowestPercent = Math.min(...rows.map((r) => r.percent_from || 0))
    const passing = rows.find((r) => (r.percent_from ?? 0) >= 35)

    return {
      total: rows.length,
      highestPoint,
      rangeStr: `${lowestPercent}% → ${highestPercent}%`,
      passingGrade: passing?.grade_name || '-',
    }
  }, [rows])

  // 12. Computed rows for export
  const exportData = useMemo(
    () =>
      filtered.map((r) => ({
        ...r,
        percent_range: `${r.percent_from}% → ${r.percent_to}%`,
      })),
    [filtered]
  )

  // 3, 4, 5, 14. Table Columns & Badges
  const columns = useMemo(
    () => [
      {
        accessorKey: 'grade_name',
        header: 'Grade',
        cell: ({ row }) => (
          <Badge className="rounded-full px-3 font-semibold" variant="default">
            {row.original.grade_name}
          </Badge>
        ),
      },
      {
        id: 'percent_range',
        header: 'Percentage Range',
        cell: ({ row }) => `${row.original.percent_from}% → ${row.original.percent_to}%`,
      },
      {
        accessorKey: 'grade_point',
        header: 'Grade Point',
        cell: ({ row }) => <Badge variant="secondary">GP {row.original.grade_point}</Badge>,
      },
    ],
    []
  )

  const rowActions = (r) => [
    { label: 'View', icon: Eye, onClick: () => setViewRow(r) },
    { label: 'Edit', icon: Pencil, onClick: () => setEditRow(r) },
    { separator: true },
    { label: 'Delete', icon: Trash2, variant: 'destructive', onClick: () => setDeleteRow(r) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/dashboard' },
          { label: 'Examinations', to: '/examinations/exam-groups' },
          { label: 'Marks Grade' },
        ]}
      />
      <PageHeader
        title="Marks Grade"
        description="Define grade bands, grade points, and percentage ranges."
        icon={BarChart3}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Grade
          </Button>
        }
      />

      {/* 1. Improved Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Grades" value={stats.total} icon={BarChart3} accent="primary" />
        <StatCard label="Highest Grade Point" value={stats.highestPoint} icon={BarChart3} accent="success" />
        <StatCard label="Percentage Range" value={stats.rangeStr} icon={BarChart3} accent="chart2" />
        <StatCard label="Passing Grade" value={stats.passingGrade} icon={BarChart3} accent="chart3" />
      </div>

      <FilterBar>
        {/* 6. Updated Search Placeholder */}
        <SearchBar value={search} onChange={setSearch} placeholder="Search grade..." className="max-w-sm" />
        <ExportButtons rows={exportData} columns={EXPORT_COLS} filename="marks-grades" />
      </FilterBar>

      {/* 11 & 14. Data Table with Row Hover and Actions Header */}
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <NoData title="No grades found" actionLabel="Add Grade" onAction={() => setAddOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          actionHeader="Actions"
          rowClassName="hover:bg-muted/40 transition-colors"
          rowActions={(r) => <ActionDropdown actions={rowActions(r)} />}
        />
      )}

      {/* Add / Edit Drawers */}
      <GradeDrawer
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Grade"
        existingRows={rows}
        onSubmit={async (p) => {
          await examinationService.createMarksGrade(p)
          toast({ title: 'Grade added', description: p.grade_name })
          setAddOpen(false)
          refetch()
        }}
      />
      <GradeDrawer
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        title="Edit Grade"
        initial={editRow}
        existingRows={rows}
        onSubmit={async (p) => {
          await examinationService.updateMarksGrade(editRow._id, p)
          toast({ title: 'Grade updated', description: p.grade_name })
          setEditRow(null)
          refetch()
        }}
      />

      {/* 13. Dynamic Drawer Title on View */}
      <Drawer
        open={!!viewRow}
        onOpenChange={(o) => !o && setViewRow(null)}
        title={`Grade ${viewRow?.grade_name || ''}`}
        description="Grade band overview"
        width="sm:max-w-sm"
        footer={
          <Button variant="outline" onClick={() => setViewRow(null)}>
            Close
          </Button>
        }
      >
        {viewRow ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              {
                label: 'Grade',
                value: <Badge className="rounded-full px-3 font-semibold">{viewRow.grade_name}</Badge>,
              },
              { label: 'Percentage Range', value: `${viewRow.percent_from}% → ${viewRow.percent_to}%` },
              { label: 'Grade Point', value: <Badge variant="secondary">GP {viewRow.grade_point}</Badge> },
            ].map((r) => (
              <div key={r.label} className="space-y-0.5">
                <dt className="text-xs font-medium text-muted-foreground">{r.label}</dt>
                <dd className="text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Drawer>

      <DeleteDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        entityName={deleteRow?.grade_name}
        onConfirm={async () => {
          await examinationService.removeMarksGrade(deleteRow._id)
          toast({ title: 'Grade deleted' })
          setDeleteRow(null)
          refetch()
        }}
      />
    </div>
  )
}

function GradeDrawer({ open, onOpenChange, title, initial, onSubmit, existingRows = [] }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    grade_name: '',
    percent_from: 0,
    percent_to: 100,
    grade_point: 0,
  })

  useEffect(() => {
    if (open) {
      setForm({
        grade_name: initial?.grade_name || '',
        percent_from: initial?.percent_from ?? 0,
        percent_to: initial?.percent_to ?? 100,
        grade_point: initial?.grade_point ?? 0,
      })
    }
  }, [open, initial])

  const handleSubmit = () => {
    if (!form.grade_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Grade Name is required.',
        variant: 'destructive',
      })
      return
    }

    // 8. Percentage Validation
    if (form.percent_from > form.percent_to) {
      toast({
        title: 'Invalid Percentage',
        description: 'Percentage From cannot exceed Percentage To.',
        variant: 'destructive',
      })
      return
    }

    // 9. Prevent Duplicate Grades
    const isDuplicate = existingRows.some(
      (r) => r.grade_name.toLowerCase() === form.grade_name.trim().toLowerCase() && r._id !== initial?._id
    )
    if (isDuplicate) {
      toast({
        title: 'Duplicate Grade',
        description: `Grade "${form.grade_name}" already exists.`,
        variant: 'destructive',
      })
      return
    }

    onSubmit(form)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Grade band details"
      width="sm:max-w-md"
      footer={
        <DrawerFooter
          onCancel={() => onOpenChange(false)}
          submitLabel={initial ? 'Save' : 'Create'}
          onSubmit={handleSubmit}
        />
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        className="space-y-4"
      >
        <FormSection columns={2}>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Grade Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.grade_name}
              onChange={(e) => setForm((f) => ({ ...f, grade_name: e.target.value }))}
              placeholder="e.g. A+"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Grade Point</Label>
            <Input
              type="number"
              value={form.grade_point}
              onChange={(e) => setForm((f) => ({ ...f, grade_point: Number(e.target.value) }))}
              placeholder="e.g. 10"
            />
          </div>

          {/* 7. Unified Percentage Range Row */}
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Percentage Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={form.percent_from}
                onChange={(e) => setForm((f) => ({ ...f, percent_from: Number(e.target.value) }))}
                placeholder="From"
              />
              <span className="text-muted-foreground text-xs font-medium">→</span>
              <Input
                type="number"
                value={form.percent_to}
                onChange={(e) => setForm((f) => ({ ...f, percent_to: Number(e.target.value) }))}
                placeholder="To"
              />
            </div>
          </div>
        </FormSection>
        <button type="submit" className="hidden" aria-hidden="true" />
      </form>
    </Drawer>
  )
}